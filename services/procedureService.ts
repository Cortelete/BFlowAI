import type { Procedure } from '../types';

/**
 * Retrieves procedure data for a specific user from localStorage.
 * @param userId - The ID of the user whose procedures to fetch.
 * @returns An array of Procedure objects. Returns an empty array if no data is found.
 */
export const getProcedures = async (userId: string): Promise<Procedure[]> => {
    const key = `beautyflow_procedures_${userId}`;
    const proceduresJson = localStorage.getItem(key);
    return Promise.resolve(proceduresJson ? JSON.parse(proceduresJson) : []);
};

/**
 * Saves procedure data for a specific user to localStorage.
 * @param userId - The ID of the user whose procedures to save.
 * @param procedures - The array of Procedure objects to save.
 */
export const saveProcedures = async (userId: string, procedures: Procedure[]): Promise<void> => {
    const key = `beautyflow_procedures_${userId}`;
    localStorage.setItem(key, JSON.stringify(procedures));
    return Promise.resolve();
};