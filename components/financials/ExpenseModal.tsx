import React, { useState } from 'react';
import type { Expense } from '../../types';
import Modal from '../common/Modal';
import { toast } from 'react-hot-toast';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Expense) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSave }) => {
    const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Outros',
        amount: 0
    });

    const handleSaveExpense = () => {
        if (!newExpense.description || newExpense.amount <= 0) {
            toast.error("Descrição e valor são obrigatórios.");
            return;
        }
        const expenseToAdd: Expense = {
            id: `exp-${Date.now()}`,
            ...newExpense
        };
        onSave(expenseToAdd);
        onClose();
        setNewExpense({ date: new Date().toISOString().split('T')[0], description: '', category: 'Outros', amount: 0 });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Nova Despesa">
            <div className="space-y-4">
                <input type="text" placeholder="Descrição da Despesa" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Valor (R$)" value={newExpense.amount || ''} onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    <input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <option>Material</option><option>Aluguel</option><option>Marketing</option><option>Salários</option><option>Impostos</option><option>Outros</option>
                </select>
                <button onClick={handleSaveExpense} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors">Salvar Despesa</button>
            </div>
        </Modal>
    );
};

export default ExpenseModal;
