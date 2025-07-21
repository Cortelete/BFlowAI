import type { Client, Appointment } from '../types';
import * as XLSX from 'xlsx';

/**
 * Retrieves client data for a specific user from localStorage.
 * @param userId - The ID of the user whose clients to fetch.
 * @returns An array of Client objects. Returns an empty array if no data is found.
 */
export const getClients = (userId: string): Client[] => {
    const key = `beautyflow_clients_${userId}`;
    const clientsJson = localStorage.getItem(key);
    return clientsJson ? JSON.parse(clientsJson) : [];
};

/**
 * Saves client data for a specific user to localStorage.
 * @param userId - The ID of the user whose clients to save.
 * @param clients - The array of Client objects to save.
 */
export const saveClients = (userId: string, clients: Client[]): void => {
    const key = `beautyflow_clients_${userId}`;
    localStorage.setItem(key, JSON.stringify(clients));
};

/**
 * Parses an uploaded Excel or CSV file to import client data.
 * @param file - The file object from a file input.
 * @returns A promise that resolves to an array of imported Client objects.
 * @throws An error if the file format is invalid or cannot be read.
 */
export const importFromExcel = (file: File): Promise<Client[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                if (!e.target || !e.target.result) {
                    throw new Error("Failed to read file.");
                }
                const data = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const importedClients: Client[] = json.map((row, index) => {
                    // Map common column names (case-insensitive) to client properties.
                    // This makes the import flexible.
                    const name = row['Nome'] || row['name'] || row['Client'] || '';
                    const phone = row['Telefone'] || row['phone'] || row['Contact'] || '';
                    const email = row['Email'] || row['email'] || '';
                    const anamnesis = row['Anamnese'] || row['Notes'] || '';
                    const lastVisitStr = row['Ultima Visita'] || row['Last Visit'];
                    const lastProcedure = row['Ultimo Procedimento'] || row['Last Procedure'] || '';
                    const price = parseFloat(row['Preco'] || row['Price'] || '0');
                    const cost = parseFloat(row['Custo'] || row['Cost'] || '0');

                    const appointments: Appointment[] = [];
                    // If the row contains appointment-like data, create one.
                    if (lastVisitStr && lastProcedure) {
                        appointments.push({
                            id: `appt-import-${Date.now()}-${index}`,
                            date: new Date(lastVisitStr).toISOString().split('T')[0],
                            procedure: lastProcedure,
                            price: isNaN(price) ? 0 : price,
                            cost: isNaN(cost) ? 0 : cost,
                        });
                    }
                    
                    return {
                        id: `client-import-${Date.now()}-${index}`,
                        name,
                        phone: String(phone),
                        email,
                        anamnesis,
                        appointments,
                    };
                }).filter(client => client.name); // Only import clients with a name.

                resolve(importedClients);
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                reject("Could not parse the file. Please ensure it's a valid Excel or CSV file.");
            }
        };

        reader.onerror = (error) => {
            reject("Failed to read the file.");
        };

        reader.readAsArrayBuffer(file);
    });
};
