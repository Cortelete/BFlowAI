/**
 * Represents a registered user in the application.
 */
export interface User {
    id: string;
    username: string;
    password:  string; // In a real production app, this should be a securely stored hash.
    isBoss?: boolean; // Flag for the special 'BOSS' user with extra permissions.
}

/**
 * Represents a single appointment for a client, including financial details.
 */
export interface Appointment {
    id: string;
    date: string; // Stored in 'YYYY-MM-DD' format.
    time?: string; // Optional: Stored in 'HH:MM' format.
    procedure: string;
    price: number;
    cost: number;
}

/**
 * Represents a client in the studio.
 * Each client now has a list of their appointments.
 */
export interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    birthDate?: string; // Optional: 'YYYY-MM-DD' format.
    anamnesis: string; // Medical/health notes.
    appointments: Appointment[]; // A list of all appointments for this client.
}

/**
 * Represents a service offered by the studio.
 */
export interface Procedure {
    id: string;
    name: string;
    defaultPrice: number;
    defaultCost: number;
}

/**
 * Represents a single financial transaction for the Financials page.
 */
export interface FinancialEntry extends Appointment {
    clientName: string;
    profit: number;
}

/**
 * Defines the categories for AI-generated business ideas.
 */
export type IdeaCategory = 'software' | 'marketing';

/**
 * Defines the categories for AI-generated marketing messages.
 */
export type MessageCategory = 'daily' | 'prospect' | 'promo' | 'birthday' | 'reminder';

/**
 * Defines the structure for storing editable text content for the BOSS user.
 * The key is an identifier for the text element, and the value is the custom text.
 */
export interface EditableText {
    [key: string]: string;
}