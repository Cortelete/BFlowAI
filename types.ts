/**
 * Represents a registered user in the application.
 */
export interface User {
    id: string;
    username: string; // Login name
    password:  string; // In a real production app, this should be a securely stored hash.
    isBoss?: boolean; // Flag for the special 'BOSS' user with extra permissions.
    
    // Basic Info
    photo?: string; // base64 encoded image
    fullName?: string;
    displayName?: string;
    userType?: 'Administrador' | 'Funcionário' | 'Secretaria' | 'Profissional Lash' | 'Cliente';
    gender?: 'Masculino' | 'Feminino' | 'Não Binário' | 'Prefiro não dizer';
    birthDate?: string; // Stored in 'YYYY-MM-DD' format
    cpf?: string;
    rg?: string;

    // Contact
    email?: string;
    altEmail?: string;
    phone?: string;
    fixedPhone?: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    tiktok?: string;

    // Address
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;

    // Professional
    role?: string;
    specialty?: string;
    bio?: string;
}


/**
 * Represents a single appointment for a client, including financial details.
 */
export interface Appointment {
    id: string;
    date: string; // Stored in 'YYYY-MM-DD' format.
    time: string; // Stored in 'HH:MM' format.
    procedure: string;
    price: number;
    cost: number;
    status: 'Pago' | 'Pendente' | 'Atrasado';
    paymentMethod?: string;
}

/**
 * Represents a standalone business expense not tied to a specific appointment.
 */
export interface Expense {
    id: string;
    date: string; // 'YYYY-MM-DD'
    description: string;
    category: 'Material' | 'Aluguel' | 'Marketing' | 'Salários' | 'Impostos' | 'Outros';
    amount: number;
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
 * A unified interface for displaying any financial transaction (revenue or expense)
 * in the dashboard and tables.
 */
export interface Transaction {
    id: string;
    date: string;
    description: string;
    clientName?: string;
    type: 'Receita' | 'Despesa';
    amount: number; // Positive for revenue, negative for expense
    profit?: number; // Only for 'Receita' type
    status: 'Pago' | 'Pendente' | 'Atrasado' | 'N/A';
    category?: string; // Procedure for Receita, category for Despesa
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