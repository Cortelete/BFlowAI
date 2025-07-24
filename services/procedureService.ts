
import type { Procedure } from '../types';

/**
 * Retrieves procedure data for a specific user from localStorage.
 * @param userId - The ID of the user whose procedures to fetch.
 * @returns An array of Procedure objects. Returns an empty array if no data is found.
 */
export const getProcedures = async (userId: string): Promise<Procedure[]> => {
    const key = `beautyflow_procedures_${userId}`;
    const proceduresJson = localStorage.getItem(key);
    
    if (proceduresJson) {
        const parsedProcedures: Procedure[] = JSON.parse(proceduresJson);
        // Hydrate old data with new fields to prevent runtime errors
        const hydratedProcedures = parsedProcedures.map(proc => ({
            ...proc,
            category: proc.category || 'Geral',
            technicalDescription: proc.technicalDescription || '',
            defaultPostProcedureInstructions: proc.defaultPostProcedureInstructions || '',
            isActive: proc.isActive !== undefined ? proc.isActive : true,
        }));
        return Promise.resolve(hydratedProcedures);
    }

    return Promise.resolve([]);
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