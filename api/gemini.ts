
import { GoogleGenAI, Type } from "@google/genai";
import type { MessageCategory, IdeaCategory, Client, ViralIdeaResponse } from '../types';

// This function runs on the server, not in the browser.
// It's safe to use process.env here.

// Initialize the AI client once per serverless function instance.
// Ensure your API_KEY is set in your Vercel project's Environment Variables.
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// This is the main handler for all requests to /api/gemini
export async function POST(req: Request) {
    if (!ai) {
        return new Response(JSON.stringify({ error: "A Chave da API não está configurada no servidor." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { action, payload } = body;

        switch (action) {
            case 'generateMarketingContent':
                const marketingResult = await handleGenerateMarketingContent(payload);
                return new Response(JSON.stringify({ text: marketingResult }), { status: 200 });

            case 'generateBusinessIdea':
                const ideaResult = await handleGenerateBusinessIdea(payload);
                return new Response(JSON.stringify({ text: ideaResult }), { status: 200 });

            case 'generateMascotTip':
                const mascotResult = await handleGenerateMascotTip();
                return new Response(JSON.stringify({ text: mascotResult }), { status: 200 });
            
            case 'generateDashboardSuggestion':
                 const suggestionResult = await handleGenerateDashboardSuggestion(payload);
                 return new Response(JSON.stringify({ text: suggestionResult }), { status: 200 });

            case 'generateViralIdea':
                const viralResult = await handleGenerateViralIdea(payload);
                return new Response(JSON.stringify(viralResult), { status: 200 });

            default:
                return new Response(JSON.stringify({ error: "Ação desconhecida." }), { status: 400 });
        }
    } catch (error: any) {
        console.error("Error in Gemini API handler:", error);
        return new Response(JSON.stringify({ error: "Erro ao processar a solicitação de IA.", details: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}


// --- Handler Logic (previously in services/geminiService.ts) ---

const getSystemInstruction = (category: MessageCategory | IdeaCategory | 'mascot' | 'dashboard', clientName?: string) => {
    let baseInstruction = "You are BeautyFlow AI, an expert AI assistant for 'Luxury Studio de Beleza Joyci Almeida', a high-end beauty studio in Brazil. Your tone is helpful, luxurious, and encouraging. Your responses should be in Brazilian Portuguese. ";

    if (clientName) {
        baseInstruction += `The message is for a client named ${clientName}. Personalize it. `;
    }

    switch (category) {
        case 'daily':
            return baseInstruction + "Generate a short, engaging beauty tip or fact for clients. Use emojis. Keep it concise and uplifting.";
        case 'prospect':
            return baseInstruction + "Generate a compelling message to attract new clients. Highlight a specific service and offer an introductory discount. Be persuasive and elegant.";
        case 'promo':
            return baseInstruction + "Generate a friendly message for an inactive client to encourage them to return. Mention that you miss them and suggest a service. Be warm and inviting.";
        case 'birthday':
            return baseInstruction + "Generate a warm and celebratory birthday message for a client. Offer a special birthday gift or discount. Use festive emojis.";
        case 'software':
            return baseInstruction + "Suggest a specific type of software or app that can help a beauty studio owner optimize their business. Explain the benefit in one sentence. Example: 'Sugestão de software: **App de Agendamento Inteligente** - Otimiza sua agenda e reduz faltas.'";
        case 'marketing':
            return baseInstruction + "Suggest a creative marketing idea to attract or retain clients for a beauty studio. Be specific and actionable. Example: 'Ideia de marketing: **Pacote Fidelidade 'Beauty VIP'** - A cada 5 procedimentos, o 6º tem 50% de desconto.'";
        case 'mascot':
            return baseInstruction + "Generate a single, very short, proactive, and helpful tip for a beauty professional using this dashboard. It should be one sentence. Start with 'Que tal...' or 'Você sabia que...'. No markdown.";
        case 'dashboard':
             return baseInstruction + "Analyze the provided client data summary and generate one specific, actionable suggestion to improve the business. For example, suggest contacting an inactive client, promoting a popular service, or noting an upcoming birthday. Be concise and start with an emoji.";
        default:
            return baseInstruction;
    }
}

async function handleGenerateMarketingContent({ category, clientName }: { category: MessageCategory, clientName?: string }): Promise<string> {
    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Please generate a message for the '${category}' category.`,
        config: { systemInstruction: getSystemInstruction(category, clientName), temperature: 0.8, topP: 0.9, thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text;
}

async function handleGenerateBusinessIdea({ category }: { category: IdeaCategory }): Promise<string> {
    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Please generate an idea for the '${category}' category.`,
        config: { systemInstruction: getSystemInstruction(category), temperature: 0.9, topP: 0.95, thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text;
}

async function handleGenerateMascotTip(): Promise<string> {
    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Generate a helpful tip.",
        config: { systemInstruction: getSystemInstruction('mascot'), temperature: 1.0, thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text;
}

async function handleGenerateDashboardSuggestion({ clients }: { clients: Client[] }): Promise<string> {
    const now = new Date();
    const inactiveClients = clients.filter(c => {
        if (c.appointments.length === 0) return true;
        const lastAppt = new Date(c.appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
        return (now.getTime() - lastAppt.getTime()) / (1000 * 3600 * 24) > 60;
    }).length;

    const upcomingBirthdays = clients.filter(c => {
        if (!c.birthDate) return false;
        const birthDate = new Date(c.birthDate);
        return (birthDate.setFullYear(now.getFullYear()) - now.getTime()) / (1000 * 3600 * 24) > 0 && (birthDate.setFullYear(now.getFullYear()) - now.getTime()) / (1000 * 3600 * 24) <= 30;
    }).length;

    const clientSummary = `Client data summary: Total clients: ${clients.length}. Inactive clients (60+ days): ${inactiveClients}. Clients with birthdays in the next 30 days: ${upcomingBirthdays}.`;

    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on this summary, give me one great suggestion. Summary: ${clientSummary}`,
        config: { systemInstruction: getSystemInstruction('dashboard'), temperature: 0.8, thinkingConfig: { thinkingBudget: 0 } },
    });
    return response.text;
}


async function handleGenerateViralIdea({ niche }: { niche: string }): Promise<ViralIdeaResponse> {
    const systemInstruction = `Você é um especialista em marketing viral para o Instagram, focado no mercado brasileiro. Sua tarefa é analisar o nicho de "${niche}" e identificar a principal tendência de conteúdo e gerar 3 ideias criativas.
- Analise o que os 5 maiores influenciadores deste nicho estão fazendo.
- Identifique padrões em formatos (Reels, Carrossel), temas (educacional, humor) e abordagens.
- Para a tendência, explique por que está funcionando.
- Para as ideias criativas, seja específico e prático, fornecendo título, descrição, formato, legenda, hashtags, emojis e CTA (Call to Action).
- Responda em JSON estruturado, em português do Brasil.`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            trend: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING }, summary: { type: Type.STRING }, analysis: { type: Type.STRING },
                    formats: { type: Type.ARRAY, items: { type: Type.STRING } }
                }, required: ["title", "summary", "analysis", "formats"]
            },
            creativeIdeas: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING },
                        format: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        caption: { type: Type.STRING }, emojis: { type: Type.STRING }, cta: { type: Type.STRING }
                    }, required: ["id", "title", "description", "format", "hashtags", "caption", "emojis", "cta"]
                }
            }
        }, required: ["trend", "creativeIdeas"]
    };

    const response = await ai!.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Gere uma tendência e 3 ideias de conteúdo viral para o nicho: ${niche}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.9 },
    });
    const jsonResponse = JSON.parse(response.text);
    jsonResponse.creativeIdeas.forEach((idea: any) => { if (!idea.id) idea.id = `idea-${Date.now()}-${Math.random()}`; });
    return jsonResponse as ViralIdeaResponse;
}
