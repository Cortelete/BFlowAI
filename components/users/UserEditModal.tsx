import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';

interface UserEditModalProps {
    user: Partial<User> | null;
    isOpen: boolean;
    isEditing: boolean;
    onClose: () => void;
    onSave: (user: Partial<User>) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, isOpen, isEditing, onClose, onSave }) => {
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

export default UserEditModal;
