import React, { useState } from 'react';
import type { User } from '../types';
import * as AuthService from '../services/authService';
import { toast } from 'react-hot-toast';

interface ProfileProps {
    user: User;
    onUserUpdate: (user: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate }) => {
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error("As novas senhas não coincidem.");
            return;
        }

        const toastId = toast.loading("Atualizando perfil...");
        try {
            const updatedUser = await AuthService.updateUser(user.id, username, password || undefined);
            onUserUpdate(updatedUser);
            toast.success("Perfil atualizado com sucesso!", { id: toastId });
            // Clear password fields after successful update
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(String(error), { id: toastId });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Meu Perfil</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Nome de Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all"
                            disabled={user.isBoss} // The BOSS username cannot be changed.
                        />
                        {user.isBoss && <p className="text-xs text-gray-500 mt-1 italic">O nome de usuário do BOSS não pode ser alterado.</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Nova Senha (deixe em branco para não alterar)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105"
                    >
                        Salvar Alterações
                    </button>
                </form>
            </div>
        </div>
    );
};
