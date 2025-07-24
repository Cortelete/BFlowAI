import type { Expense } from '../types';

/**
 * Retrieves expense data for a specific user from localStorage.
 * @param userId - The ID of the user whose expenses to fetch.
 * @returns An array of Expense objects.
 */
export const getExpenses = async (userId: string): Promise<Expense[]> => {
    const key = `beautyflow_expenses_${userId}`;
    const expensesJson = localStorage.getItem(key);
     if (!expensesJson && userId.includes('boss')) {
        const firstOfMonth = new Date(new Date().setDate(1)).toISOString().split('T')[0];
        const fifthOfMonth = new Date(new Date().setDate(5)).toISOString().split('T')[0];

        const defaultExpenses: Expense[] = [
            { id: `exp-default-1`, date: firstOfMonth, description: 'Aluguel do Studio', category: 'Aluguel', amount: 1200 },
            { id: `exp-default-2`, date: fifthOfMonth, description: 'Compra de Cílios e Adesivos', category: 'Material', amount: 450 },
            { id: `exp-default-3`, date: fifthOfMonth, description: 'Anúncio Instagram', category: 'Marketing', amount: 150 },
        ];
        return Promise.resolve(defaultExpenses);
    }
    return Promise.resolve(expensesJson ? JSON.parse(expensesJson) : []);
};

/**
 * Saves expense data for a specific user to localStorage.
 * @param userId - The ID of the user whose expenses to save.
 * @param expenses - The array of Expense objects to save.
 */
export const saveExpenses = async (userId: string, expenses: Expense[]): Promise<void> => {
    const key = `beautyflow_expenses_${userId}`;
    localStorage.setItem(key, JSON.stringify(expenses));
    return Promise.resolve();
};
