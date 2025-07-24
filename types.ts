
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


// --- START OF NEW APPOINTMENT/PROCEDURE RECORD TYPES ---

export interface MaterialUsed {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    cost: number;
    lotNumber?: string;
    expirationDate?: string;
}

export interface ProcedureImage {
    id: string;
    url: string; // base64
    type: 'Antes' | 'Depois' | 'Durante';
    caption: string;
}

export interface ProcedureStep {
    id: string;
    name: string;
    done: boolean;
}

/**
 * Represents a complete clinical record for a performed procedure.
 * This replaces the previous simple Appointment interface.
 */
export interface Appointment {
    id: string;
    
    // Section 1: Dados Gerais
    procedureName: string;
    category: string;
    date: string; // 'YYYY-MM-DD'
    startTime: string; // 'HH:MM'
    endTime: string; // 'HH:MM'
    professional: string;
    generalNotes: string;
    
    // Section 2: Materiais e Técnicas
    materials: MaterialUsed[];
    equipmentUsed: string;
    procedureSteps: ProcedureStep[];
    technique: string;
    difficulty: 'Fácil' | 'Médio' | 'Difícil' | '';
    reactionDescription: string;
    technicalNotes: string;
    tags: string[];
    
    // Section 3: Financeiro
    value: number;
    discount: number;
    finalValue: number;
    paymentMethod: 'Dinheiro' | 'Cartão Crédito/Débito' | 'Pix' | 'Transferência' | 'Cortesia' | 'Fidelidade' | '';
    status: 'Pago' | 'Pendente' | 'Atrasado';
    cost: number; // calculated from materials
    commission: number; // in percentage or absolute value
    
    // Section 4: Imagens
    media: ProcedureImage[];
    
    // Section 5: Pós-Atendimento
    postProcedureInstructions: string;
    requiresReturn: boolean;
    returnDate?: string;
    
    // Section 6: Documentação & Configurações Internas
    consentSigned: boolean;
    imageAuthSigned: boolean;
    
    // Section 7: Avaliação
    clientSatisfaction: number; // 0-5 stars
    internalNotes: string;
    
    // Legacy fields for compatibility. `procedure` is now `procedureName`, `price` is `value`.
    procedure: string;
    price: number; 
    duration: number; // in minutes, calculated from start/end time or manual
    time: string; // Replaced by startTime/endTime

    // Field removed as it's part of the procedure template, not the record.
    // isActiveInCatalog: boolean; 
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

// --- START OF CRM/ANAMNESIS TYPES ---

export interface AnamnesisHealthHistory {
    hypertension: boolean;
    diabetes: boolean;
    hormonalDisorders: boolean;
    epilepsy: boolean;
    heartDisease: boolean;
    autoimmuneDisease: boolean;
    respiratoryProblems: boolean;
    respiratoryAllergies: boolean;
    cancer: boolean;
    pacemaker: boolean;
    skinDisease: boolean;
    keloids: boolean;
    hepatitis: boolean;
    hiv: boolean;
    otherConditions: string;
}

export interface AnamnesisMedications {
    currentMedications: string;
    roaccutane: boolean;
    contraceptive: boolean;
}

export interface AnamnesisAllergies {
    alcohol: boolean;
    latex: boolean;
    cosmetics: boolean;
    localAnesthetics: boolean;
    lashGlue: boolean;
    makeup: boolean;
    henna: boolean;
    otherAllergies: string;
}

export interface AnamnesisAestheticHistory {
    lashExtensions: {
        hasDoneBefore: boolean;
        hadReaction: boolean;
        reactionDescription: string;
        wearsContacts: boolean;
        usesEyeDrops: boolean;
    };
    browDesign: {
        usedHenna: boolean;
        allergicReactions: string;
        hasScars: boolean;
    };
    skinCare: {
        skinType: 'Oleosa' | 'Seca' | 'Mista' | 'Sensível' | 'Acneica' | 'N/A' | '';
        usesAcids: boolean;
        hadNeedling: boolean;
        recentProcedures: boolean;
    };
}

export interface AnamnesisCareRoutine {
    usesSunscreen: boolean;
    currentProducts: string;
}

export interface AnamnesisRecord {
    healthHistory: AnamnesisHealthHistory;
    medications: AnamnesisMedications;
    allergies: AnamnesisAllergies;
    aestheticHistory: AnamnesisAestheticHistory;
    careRoutine: AnamnesisCareRoutine;
    professionalNotes: string;
    imageAuth: boolean;
    declaration: boolean;
}

/**
 * Represents a client in the studio, now with a full CRM profile.
 */
export interface Client {
    id: string;
    photo?: string;
    name: string;
    phone: string;
    email: string;
    birthDate?: string;
    gender?: 'Feminino' | 'Masculino' | 'Não Binário' | 'Prefiro não dizer' | '';
    cpf?: string;
    profession?: string;
    howTheyMetUs?: string;
    tags?: string[];
    // New aesthetic preferences fields
    aestheticGoals?: string;
    usualProcedures?: string;
    careFrequency?: string;
    areasOfInterest?: string[];
    // Internal notes for the professional
    internalNotes?: string;
    anamnesis: AnamnesisRecord;
    appointments: Appointment[];
}

// --- END OF CRM/ANAMNESIS TYPES ---

/**
 * Represents a service offered by the studio.
 */
export interface Procedure {
    id: string;
    name: string;
    category: string;
    defaultPrice: number;
    defaultCost: number;
    defaultDuration: number; // Duration in minutes
    technicalDescription: string;
    defaultPostProcedureInstructions: string;
    isActive: boolean;
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
