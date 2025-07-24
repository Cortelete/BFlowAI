import React from 'react';
import type { Procedure } from '../../types';
import { Icon } from '../common/Icon';

interface ProcedureCardProps {
    proc: Procedure;
    onEdit: (proc: Procedure) => void;
    onDelete: (id: string) => void;
    isBoss: boolean;
}

const ProcedureCard: React.FC<ProcedureCardProps> = ({ proc, onEdit, onDelete, isBoss }) => {
    return (
        <div className={`bg-white/20 dark:bg-black/30 backdrop-blur-lg border border-white/20 dark:border-black/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-pink-300/50 ${!proc.isActive ? 'opacity-50' : ''}`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl mb-1 text-gray-800 dark:text-white truncate pr-2">{proc.name}</h3>
                    <span className="text-xs font-semibold bg-brand-purple-100 text-brand-purple-800 px-2 py-0.5 rounded-full dark:bg-brand-purple-500/30 dark:text-brand-purple-200 whitespace-nowrap">{proc.category}</span>
                </div>
                {!proc.isActive && <p className="text-xs text-red-500 font-semibold mb-2">Inativo</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">{proc.technicalDescription || 'Sem descrição técnica.'}</p>
                <div className="space-y-2 text-sm border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                    <div className="flex items-center gap-2">
                        <Icon icon="dollar-sign" className="w-4 h-4 text-green-500" />
                        <span>Preço: <span className="font-semibold">{proc.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon="receipt" className="w-4 h-4 text-red-500" />
                        <span>Custo: <span className="font-semibold">{proc.defaultCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon="clock" className="w-4 h-4 text-blue-500" />
                        <span>Duração: <span className="font-semibold">{proc.defaultDuration} min</span></span>
                    </div>
                </div>
            </div>
            {isBoss && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button onClick={() => onEdit(proc)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">Editar</button>
                    <button onClick={() => onDelete(proc.id)} className="text-red-500 dark:text-red-400 hover:underline text-sm font-semibold">Excluir</button>
                </div>
            )}
        </div>
    );
};

export default ProcedureCard;
