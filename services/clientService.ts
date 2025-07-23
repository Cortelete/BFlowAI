
import type { Client, Appointment, AnamnesisRecord } from '../types';
import * as XLSX from 'xlsx';

const emptyAnamnesisRecord: AnamnesisRecord = {
    healthHistory: {
        hypertension: false, diabetes: false, hormonalDisorders: false, epilepsy: false, heartDisease: false,
        autoimmuneDisease: false, respiratoryProblems: false, respiratoryAllergies: false, cancer: false,
        pacemaker: false, skinDisease: false, keloids: false, hepatitis: false, hiv: false, otherConditions: ''
    },
    medications: { currentMedications: '', roaccutane: false, contraceptive: false },
    allergies: {
        alcohol: false, latex: false, cosmetics: false, localAnesthetics: false, lashGlue: false,
        makeup: false, henna: false, otherAllergies: ''
    },
    aestheticHistory: {
        lashExtensions: { hasDoneBefore: false, hadReaction: false, reactionDescription: '', wearsContacts: false, usesEyeDrops: false },
        browDesign: { usedHenna: false, allergicReactions: '', hasScars: false },
        skinCare: { skinType: '', usesAcids: false, hadNeedling: false, recentProcedures: false }
    },
    careRoutine: { usesSunscreen: false, currentProducts: '' },
    professionalNotes: '',
    imageAuth: false,
    declaration: false,
};

export const createEmptyAppointment = (date?: string): Appointment => {
    return {
        id: `appt-${Date.now()}`,
        procedureName: '',
        category: '',
        date: date || new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        professional: '',
        generalNotes: '',
        materials: [],
        duration: 60,
        technicalNotes: '',
        value: 0,
        discount: 0,
        finalValue: 0,
        paymentMethod: '',
        status: 'Pendente',
        cost: 0,
        commission: 0,
        media: [],
        postProcedureInstructions: '',
        requiresReturn: false,
        consentSigned: false,
        imageAuthSigned: false,
        isActiveInCatalog: true,
        clientSatisfaction: 0,
        internalNotes: '',
        // Legacy fields
        procedure: '',
        price: 0,
        time: '09:00',
    };
};


/**
 * Retrieves client data for a specific user from localStorage.
 * @param userId - The ID of the user whose clients to fetch.
 * @returns A promise that resolves to an array of Client objects.
 */
export const getClients = async (userId: string): Promise<Client[]> => {
    const key = `beautyflow_clients_${userId}`;
    const clientsJson = localStorage.getItem(key);
    if (!clientsJson) return Promise.resolve([]);

    // Hydrate clients with new structures if they are old format
    const parsedClients = JSON.parse(clientsJson);
    const hydratedClients = parsedClients.map((client: any) => {
        // Hydrate anamnesis
        if (typeof client.anamnesis === 'string' || !client.anamnesis.healthHistory) {
             client.anamnesis = { ...emptyAnamnesisRecord, professionalNotes: client.anamnesis || '' }
        }
        // Hydrate appointments
        if(client.appointments && client.appointments.length > 0) {
            client.appointments = client.appointments.map((appt: any) => {
                if(!appt.procedureName) { // Old format detected
                    const empty = createEmptyAppointment(appt.date);
                    return {
                        ...empty,
                        id: appt.id,
                        procedureName: appt.procedure,
                        procedure: appt.procedure,
                        value: appt.price,
                        price: appt.price,
                        cost: appt.cost,
                        duration: appt.duration,
                        status: appt.status,
                        time: appt.time,
                        startTime: appt.time,
                    }
                }
                return appt;
            });
        }

        return client;
    });

    return Promise.resolve(hydratedClients);
};

/**
 * Saves client data for a specific user to localStorage.
 * @param userId - The ID of the user whose clients to save.
 * @param clients - The array of Client objects to save.
 * @returns A promise that resolves when the data is saved.
 */
export const saveClients = async (userId: string, clients: Client[]): Promise<void> => {
    const key = `beautyflow_clients_${userId}`;
    localStorage.setItem(key, JSON.stringify(clients));
    return Promise.resolve();
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
                    const name = row['Nome'] || row['name'] || row['Client'] || '';
                    const phone = row['Telefone'] || row['phone'] || row['Contact'] || '';
                    const email = row['Email'] || row['email'] || '';
                    const quickNotes = row['Anamnese'] || row['Notes'] || '';
                    const lastVisitStr = row['Ultima Visita'] || row['Last Visit'];
                    const lastProcedure = row['Ultimo Procedimento'] || row['Last Procedure'] || '';
                    const price = parseFloat(row['Preco'] || row['Price'] || '0');
                    const cost = parseFloat(row['Custo'] || row['Cost'] || '0');

                    const appointments: Appointment[] = [];
                    // If the row contains appointment-like data, create one.
                    if (lastVisitStr && lastProcedure) {
                        const newAppt = createEmptyAppointment(new Date(lastVisitStr).toISOString().split('T')[0]);
                        newAppt.id = `appt-import-${Date.now()}-${index}`;
                        newAppt.procedureName = lastProcedure;
                        newAppt.procedure = lastProcedure;
                        newAppt.value = isNaN(price) ? 0 : price;
                        newAppt.price = isNaN(price) ? 0 : price;
                        newAppt.finalValue = isNaN(price) ? 0 : price;
                        newAppt.cost = isNaN(cost) ? 0 : cost;
                        newAppt.status = 'Pago';
                        appointments.push(newAppt);
                    }
                    
                    return {
                        id: `client-import-${Date.now()}-${index}`,
                        name,
                        phone: String(phone),
                        email,
                        anamnesis: {
                            ...emptyAnamnesisRecord,
                            professionalNotes: quickNotes, // Add any simple notes from import to the professional notes section
                        },
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
