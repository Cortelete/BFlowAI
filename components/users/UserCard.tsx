import React from 'react';
import type { User } from '../../types';

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
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

export default UserCard;
