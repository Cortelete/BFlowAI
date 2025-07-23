
import type { MessageCategory, IdeaCategory, Client, ViralIdeaResponse } from '../types';

/**
 * A helper function to call our secure backend API endpoint.
 * @param action - The name of the function to trigger on the backend.
 * @param payload - The data to send to the backend function.
 * @returns The JSON response from the backend.
 * @throws An error if the network request fails or the API returns an error.
 */
async function callGeminiApi(action: string, payload: any) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha na comunicação com a IA.');
    }

    return response.json();
}

/**
 * Generates marketing content by calling our secure backend.
 * @param category - The type of message to generate.
 * @param clientName - Optional name of the client for personalization.
 * @returns The generated text content.
 */
export const generateMarketingContent = async (category: MessageCategory, clientName?: string): Promise<string> => {
    try {
        const result = await callGeminiApi('generateMarketingContent', { category, clientName });
        return result.text;
    } catch (error) {
        console.error("Error generating marketing content:", error);
        return "Desculpe, não foi possível gerar o conteúdo no momento. Tente novamente mais tarde.";
    }
};

/**
 * Generates business ideas by calling our secure backend.
 * @param category - The type of idea to generate ('software', 'marketing').
 * @returns The generated text content.
 */
export const generateBusinessIdea = async (category: IdeaCategory): Promise<string> => {
    try {
        const result = await callGeminiApi('generateBusinessIdea', { category });
        return result.text;
    } catch (error) {
        console.error("Error generating business idea:", error);
        return "Desculpe, não foi possível gerar a ideia no momento. Tente novamente mais tarde.";
    }
};

/**
 * Generates a short, helpful tip for the mascot by calling our secure backend.
 * @returns The generated text content.
 */
export const generateMascotTip = async (): Promise<string> => {
    try {
        const result = await callGeminiApi('generateMascotTip', {});
        return result.text;
    } catch (error) {
        console.error("Error generating mascot tip:", error);
        return "Lembre-se de beber água!";
    }
};

/**
 * Generates a contextual suggestion for the dashboard by calling our secure backend.
 * @param clients - The list of clients to analyze.
 * @returns The generated text content.
 */
export const generateDashboardSuggestion = async (clients: Client[]): Promise<string> => {
    if (clients.length === 0) return "Adicione seus primeiros clientes para receber sugestões personalizadas!";
    
    try {
        const result = await callGeminiApi('generateDashboardSuggestion', { clients });
        return result.text;
    } catch (error) {
        console.error("Error generating dashboard suggestion:", error);
        return "😕 Não foi possível gerar uma sugestão. Tente novamente.";
    }
};

/**
 * Generates viral content ideas for a given niche by calling our secure backend.
 * @param niche - The user's area of business (e.g., 'lash extensions').
 * @returns A structured object with a trend and creative ideas.
 */
export const generateViralIdea = async (niche: string): Promise<ViralIdeaResponse> => {
    try {
        const result = await callGeminiApi('generateViralIdea', { niche });
        return result as ViralIdeaResponse;
    } catch (error) {
        console.error("Error generating viral idea:", error);
        throw new Error("Não foi possível gerar as ideias no momento. A IA pode estar sobrecarregada. Tente novamente.");
    }
};
