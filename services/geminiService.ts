
import { GoogleGenAI } from "@google/genai";
import type { MessageCategory, IdeaCategory, Client } from '../types';

// IMPORTANT: This service now gets the API key from the environment.
// The config.ts file is no longer used for the API key.

// No global AI initialization to prevent crashing if API_KEY is missing.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// const model = "gemini-2.5-flash";

const getSystemInstruction = (category: MessageCategory | IdeaCategory | 'mascot' | 'dashboard', clientName?: string) => {
    let baseInstruction = "You are BeautyFlow AI, an expert AI assistant for 'Luxury Studio de Beleza Joyci Almeida', a high-end beauty studio in Brazil. Your tone is helpful, luxurious, and encouraging. Your responses should be in Brazilian Portuguese. ";

    if (clientName) {
        baseInstruction += `The message is for a client named ${clientName}. Personalize it. `;
    }

    switch (category) {
        // Communication
        case 'daily':
            return baseInstruction + "Generate a short, engaging beauty tip or fact for clients. Use emojis. Keep it concise and uplifting.";
        case 'prospect':
            return baseInstruction + "Generate a compelling message to attract new clients. Highlight a specific service and offer an introductory discount. Be persuasive and elegant.";
        case 'promo':
            return baseInstruction + "Generate a friendly message for an inactive client to encourage them to return. Mention that you miss them and suggest a service. Be warm and inviting.";
        case 'birthday':
            return baseInstruction + "Generate a warm and celebratory birthday message for a client. Offer a special birthday gift or discount. Use festive emojis.";
        // Ideas
        case 'software':
            return baseInstruction + "Suggest a specific type of software or app that can help a beauty studio owner optimize their business. Explain the benefit in one sentence. Example: 'Sugestão de software: **App de Agendamento Inteligente** - Otimiza sua agenda e reduz faltas.'";
        case 'marketing':
            return baseInstruction + "Suggest a creative marketing idea to attract or retain clients for a beauty studio. Be specific and actionable. Example: 'Ideia de marketing: **Pacote Fidelidade 'Beauty VIP'** - A cada 5 procedimentos, o 6º tem 50% de desconto.'";
        // App Helpers
        case 'mascot':
            return baseInstruction + "Generate a single, very short, proactive, and helpful tip for a beauty professional using this dashboard. It should be one sentence. Start with 'Que tal...' or 'Você sabia que...'. No markdown.";
        case 'dashboard':
             return baseInstruction + "Analyze the provided client data summary and generate one specific, actionable suggestion to improve the business. For example, suggest contacting an inactive client, promoting a popular service, or noting an upcoming birthday. Be concise and start with an emoji.";
        default:
            return baseInstruction;
    }
}

/**
 * Generates marketing content using the Gemini API.
 * @param category - The type of message to generate.
 * @param clientName - Optional name of the client for personalization.
 * @returns The generated text content.
 */
export const generateMarketingContent = async (category: MessageCategory, clientName?: string): Promise<string> => {
    if (!process.env.API_KEY) return "A Chave da API não está configurada. As funções de IA estão desabilitadas.";
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please generate a message for the '${category}' category.`,
            config: {
                systemInstruction: getSystemInstruction(category, clientName),
                temperature: 0.8,
                topP: 0.9,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating marketing content:", error);
        return "Desculpe, não foi possível gerar o conteúdo no momento. Tente novamente mais tarde.";
    }
};

/**
 * Generates business ideas using the Gemini API.
 * @param category - The type of idea to generate ('software', 'marketing').
 * @returns The generated text content.
 */
export const generateBusinessIdea = async (category: IdeaCategory): Promise<string> => {
    if (!process.env.API_KEY) return "A Chave da API não está configurada. As funções de IA estão desabilitadas.";
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please generate an idea for the '${category}' category.`,
            config: {
                systemInstruction: getSystemInstruction(category),
                temperature: 0.9,
                topP: 0.95,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating business idea:", error);
        return "Desculpe, não foi possível gerar a ideia no momento. Tente novamente mais tarde.";
    }
};


/**
 * Generates a short, helpful tip for the mascot.
 * @returns The generated text content.
 */
export const generateMascotTip = async (): Promise<string> => {
    if (!process.env.API_KEY) return "Olá! Para receber dicas da IA, configure sua Chave de API.";
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Generate a helpful tip.",
            config: {
                systemInstruction: getSystemInstruction('mascot'),
                temperature: 1.0,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating mascot tip:", error);
        return "Lembre-se de beber água!";
    }
};

/**
 * Generates a contextual suggestion for the dashboard.
 * @param clients - The list of clients to analyze.
 * @returns The generated text content.
 */
export const generateDashboardSuggestion = async (clients: Client[]): Promise<string> => {
    if (!process.env.API_KEY) return "💡 Configure sua Chave de API para receber sugestões personalizadas!";
    if (clients.length === 0) return "Adicione seus primeiros clientes para receber sugestões personalizadas!";
    
    // Create a concise summary of client data for the AI
    const now = new Date();
    const inactiveClients = clients.filter(c => {
        if (c.appointments.length === 0) return true;
        const lastAppt = new Date(c.appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
        const diffDays = (now.getTime() - lastAppt.getTime()) / (1000 * 3600 * 24);
        return diffDays > 60;
    }).length;

    const upcomingBirthdays = clients.filter(c => {
        if (!c.birthDate) return false;
        const birthDate = new Date(c.birthDate);
        const diffDays = (birthDate.setFullYear(now.getFullYear()) - now.getTime()) / (1000 * 3600 * 24);
        return diffDays > 0 && diffDays <= 30;
    }).length;

    const clientSummary = `Client data summary: Total clients: ${clients.length}. Inactive clients (60+ days): ${inactiveClients}. Clients with birthdays in the next 30 days: ${upcomingBirthdays}.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on this summary, give me one great suggestion. Summary: ${clientSummary}`,
            config: {
                systemInstruction: getSystemInstruction('dashboard'),
                temperature: 0.8,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating dashboard suggestion:", error);
        return "😕 Não foi possível gerar uma sugestão. Tente novamente.";
    }
};
