
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import * as AuthService from '../services/authService';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';
import { toast } from 'react-hot-toast';

interface UsersProps {
    currentUser: User;
}

const UserCard: React.FC<{ user: User, onEdit: (user: User) => void, onDelete: (user: User) => void }> = ({ user, onEdit, onDelete }) => {
    return (
        <div className="bg-white/20 dark:bg-black/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <img
                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=9B59B6&color=fff&size=96`}
                alt={user.fullName || user.username}
                className="w-24 h-24 rounded-full object-cover shadow-lg mb-4"
            />
            <h3 className="font-bold text-lg text-gray-800 dark:text-white truncate w-full">{user.fullName || user.username}</h3>
            <p className="text-sm text-brand-purple-500 dark:text-brand-purple-300 font-semibold mb-1">{user.userType}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{user.role || 'Sem cargo'}</p>
            <div className="flex justify-center gap-2 mt-auto pt-4 border-t border-gray-200/50 dark:border-gray-700/50 w-full">
                <button onClick={() => onEdit(user)} className="bg-blue-500 text-white px-3 py-1 text-sm rounded-lg shadow hover:bg-blue-600">Editar</button>
                <button onClick={() => onDelete(user)} disabled={user.isBoss} className="bg-red-500 text-white px-3 py-1 text-sm rounded-lg shadow hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed">Excluir</button>
            </div>
        </div>
    );
};

const UserEditModal: React.FC<{
    user: Partial<User> | null,
    isOpen: boolean,
    isEditing: boolean,
    onClose: () => void,
    onSave: (user: Partial<User>) => void
}> = ({ user, isOpen, isEditing, onClose, onSave }) => {
    const [editableUser, setEditableUser] = useState<Partial<User>>({});

    useEffect(() => {
        if (user) {
            setEditableUser(user);
        } else {
            // Defaults for a new user
            setEditableUser({ userType: 'Funcionário', password: '' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableUser(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveChanges = () => {
        if (!editableUser.username) {
            toast.error("O nome de usuário é obrigatório.");
            return;
        }
        if (!isEditing && !editableUser.password) {
            toast.error("A senha é obrigatória para novos usuários.");
            return;
        }
        onSave(editableUser);
    }

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Usuário' : 'Adicionar Novo Usuário'} maxWidth="max-w-2xl">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <h4 className="font-bold text-lg border-b pb-2">Dados do Perfil</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-semibold block mb-1">Nome de Login (Usuário)</label>
                        <input name="username" value={editableUser.username || ''} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold block mb-1">Nome Completo</label>
                        <input name="fullName" value={editableUser.fullName || ''} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold block mb-1">Tipo de Usuário</label>
                         <select name="userType" value={editableUser.userType} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <option>Funcionário</option>
                            <option>Profissional Lash</option>
                            <option>Secretaria</option>
                            <option>Cliente</option>
                            <option>Administrador</option>
                         </select>
                    </div>
                     <div>
                        <label className="text-sm font-semibold block mb-1">Cargo/Função</label>
                        <input name="role" value={editableUser.role || ''} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold block mb-1">E-mail</label>
                        <input type="email" name="email" value={editableUser.email || ''} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold block mb-1">Telefone</label>
                        <input type="tel" name="phone" value={editableUser.phone || ''} onChange={handleChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    </div>
                </div>
                <h4 className="font-bold text-lg border-b pb-2 pt-4">Segurança</h4>
                 <div>
                    <label className="text-sm font-semibold block mb-1">Senha</label>
                    <input type="password" name="password" value={editableUser.password || ''} onChange={handleChange} placeholder={isEditing ? 'Deixe em branco para não alterar' : 'Senha inicial obrigatória'} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
                 <button onClick={handleSaveChanges} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors mt-6">
                    Salvar
                </button>
            </div>
        </Modal>
    )
}

export const Users: React.FC<UsersProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Partial<User> | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const users = await AuthService.getAllUsers();
            setAllUsers(users);
        } catch (error) {
            toast.error("Não foi possível carregar os usuários.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Security check
        if (currentUser.userType !== 'Administrador' && !currentUser.isBoss) {
            toast.error("Acesso negado.");
            navigate('/');
            return;
        }
        fetchUsers();
    }, [currentUser, navigate, fetchUsers]);

    const handleAdd = () => {
        setSelectedUser(null);
        setIsEditing(false);
        setModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditing(true);
        setModalOpen(true);
    };

    const handleDelete = async (user: User) => {
        if(window.confirm(`Tem certeza que deseja excluir o usuário ${user.username}? Todos os seus dados serão perdidos.`)) {
            try {
                await AuthService.deleteUser(user.id);
                toast.success(`Usuário ${user.username} excluído.`);
                fetchUsers(); // Refresh list
            } catch (error) {
                toast.error(String(error));
            }
        }
    };

    const handleSave = async (userData: Partial<User>) => {
        const toastId = toast.loading(isEditing ? "Atualizando usuário..." : "Criando usuário...");
        try {
            if (isEditing) {
                await AuthService.updateUser(userData.id!, userData);
                toast.success("Usuário atualizado com sucesso!", { id: toastId });
            } else {
                await AuthService.adminAddUser(userData);
                toast.success("Usuário adicionado com sucesso!", { id: toastId });
            }
            setModalOpen(false);
            fetchUsers();
        } catch (error) {
            toast.error(String(error), { id: toastId });
        }
    }

    if (isLoading) {
        return <p className="text-center p-8">Carregando usuários...</p>
    }

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Gerenciamento de Usuários</h2>
                    <button onClick={handleAdd} className="bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                        <Icon icon="plus" className="w-5 h-5"/> Adicionar Usuário
                    </button>
                </div>

                 {allUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {allUsers.map(user => (
                            <UserCard key={user.id} user={user} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold">Nenhum usuário encontrado.</h3>
                        <p className="text-sm text-gray-500">Comece adicionando o primeiro membro da sua equipe.</p>
                    </div>
                )}
            </div>

            <UserEditModal 
                isOpen={isModalOpen}
                isEditing={isEditing}
                user={selectedUser}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
};
