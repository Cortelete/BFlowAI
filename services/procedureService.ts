
import type { Procedure } from '../types';

/**
 * Retrieves procedure data for a specific user from localStorage.
 * If it's the BOSS user's first time, it seeds the account with default procedures.
 * @param userId - The ID of the user whose procedures to fetch.
 * @returns An array of Procedure objects.
 */
export const getProcedures = async (userId: string): Promise<Procedure[]> => {
    const key = `beautyflow_procedures_${userId}`;
    const proceduresJson = localStorage.getItem(key);
    
    // If procedures exist and the list is not empty, parse, hydrate and return them
    if (proceduresJson) {
        const parsedProcedures: Procedure[] = JSON.parse(proceduresJson);
        // Robustness check: if it's an empty array and it's the boss, still seed.
        if(parsedProcedures.length > 0) {
            const hydratedProcedures = parsedProcedures.map(proc => ({
                ...proc,
                category: proc.category || 'Geral',
                technicalDescription: proc.technicalDescription || '',
                defaultPostProcedureInstructions: proc.defaultPostProcedureInstructions || '',
                isActive: proc.isActive !== undefined ? proc.isActive : true,
            }));
            return Promise.resolve(hydratedProcedures);
        }
    }
    
    // If no procedures (or empty array) and it's the BOSS user, create default ones
    if (userId.includes('boss')) {
        const defaultProcedures: Procedure[] = [
            {
                id: 'proc-default-1', name: 'Extensão de Cílios - Fio a Fio Clássico', category: 'Lash Design', defaultPrice: 180, defaultCost: 25, defaultDuration: 120,
                technicalDescription: 'Técnica que aplica um fio sintético sobre cada fio natural, proporcionando alongamento e definição com um resultado extremamente natural. Ideal para quem busca um primeiro contato com extensões.',
                defaultPostProcedureInstructions: 'Evitar molhar por 24h. Não usar rímel. Pentear os cílios diariamente. Limpar com shampoo específico.',
                isActive: true,
            },
            {
                id: 'proc-default-2', name: 'Extensão de Cílios - Volume Brasileiro', category: 'Lash Design', defaultPrice: 220, defaultCost: 35, defaultDuration: 150,
                technicalDescription: 'Utiliza fios em formato de Y, criando um efeito de volume entrelaçado, com mais densidade que o clássico, mas ainda com leveza e naturalidade.',
                defaultPostProcedureInstructions: 'Mesmos cuidados do Fio a Fio. Evitar atrito e demaquilantes oleosos.',
                isActive: true,
            },
            {
                id: 'proc-default-3', name: 'Extensão de Cílios - Volume Russo', category: 'Lash Design', defaultPrice: 280, defaultCost: 45, defaultDuration: 180,
                technicalDescription: 'Criação de fans (leques) com 3 a 7 fios ultrafinos, aplicados em cada fio natural. Proporciona um olhar dramático, cheio e glamoroso.',
                defaultPostProcedureInstructions: 'Cuidados redobrados com a limpeza para manter os fans abertos. Manutenção recomendada a cada 3 semanas.',
                isActive: true,
            },
            {
                id: 'proc-default-4', name: 'Lash Lifting com Coloração', category: 'Lash Design', defaultPrice: 150, defaultCost: 20, defaultDuration: 75,
                technicalDescription: 'Procedimento que curva e tinge os cílios naturais desde a raiz, proporcionando um efeito de "rímel natural" que dura de 6 a 8 semanas. Ideal para quem não quer manutenção de extensão.',
                defaultPostProcedureInstructions: 'Não molhar ou usar maquiagem por 24h. Hidratar os fios com produtos recomendados.',
                isActive: true,
            },
            {
                id: 'proc-default-5', name: 'Design de Sobrancelhas com Henna', category: 'Sobrancelha', defaultPrice: 70, defaultCost: 10, defaultDuration: 60,
                technicalDescription: 'Mapeamento facial para encontrar o desenho ideal da sobrancelha, seguido pela depilação (cera ou pinça) e aplicação de henna para preencher falhas e definir o formato.',
                defaultPostProcedureInstructions: 'Evitar molhar a área por 12h. Não esfregar. Usar produtos suaves na limpeza do rosto.',
                isActive: true,
            },
            {
                id: 'proc-default-6', name: 'Brow Lamination', category: 'Sobrancelha', defaultPrice: 160, defaultCost: 25, defaultDuration: 70,
                technicalDescription: 'Técnica que alisa e direciona os pelos da sobrancelha, criando um efeito de fios mais grossos, cheios e "penteados para cima". O resultado é uma sobrancelha estilizada e moderna.',
                defaultPostProcedureInstructions: 'Não molhar por 24h. Hidratar diariamente com o produto recomendado. Pentear os fios no lugar.',
                isActive: true,
            },
            {
                id: 'proc-default-7', name: 'Limpeza de Pele Profunda com Extração', category: 'Limpeza de Pele', defaultPrice: 180, defaultCost: 30, defaultDuration: 90,
                technicalDescription: 'Higienização, esfoliação, tonificação, uso de vapor de ozônio para abrir os poros, extração de cravos e espinhas, máscara calmante e finalização com protetor solar.',
                defaultPostProcedureInstructions: 'Evitar sol por 48h. Usar protetor solar. Não usar produtos abrasivos por 3 dias. Manter a pele hidratada.',
                isActive: true,
            },
            {
                id: 'proc-default-8', name: 'Hydra Gloss Lips', category: 'Facial', defaultPrice: 130, defaultCost: 20, defaultDuration: 50,
                technicalDescription: 'Tratamento de hidratação e rejuvenescimento labial que utiliza microagulhamento suave e séruns com ácido hialurônico e vitaminas. Promove lábios mais macios, corados e com efeito gloss.',
                defaultPostProcedureInstructions: 'Beber bastante água. Usar o hidratante labial recomendado. Evitar alimentos muito quentes ou ácidos no primeiro dia.',
                isActive: true,
            },
            {
                id: 'proc-default-9', name: 'Microagulhamento Facial (Dermapen)', category: 'Facial', defaultPrice: 250, defaultCost: 50, defaultDuration: 75,
                technicalDescription: 'Terapia de indução de colágeno que utiliza um dispositivo com microagulhas para estimular a regeneração celular e a produção de colágeno. Melhora cicatrizes de acne, linhas finas e a textura da pele.',
                defaultPostProcedureInstructions: 'Pele pode ficar vermelha por 24-48h. Evitar sol completamente por 72h e usar FPS alto. Usar apenas os produtos de home care indicados.',
                isActive: true,
            },
            {
                id: 'proc-default-10', name: 'Radiofrequência Facial (Lifting)', category: 'Radiofrequência', defaultPrice: 200, defaultCost: 25, defaultDuration: 60,
                technicalDescription: 'Tratamento não invasivo que utiliza ondas de calor para aquecer as camadas profundas da pele, estimulando a contração e a produção de novo colágeno. Resulta em uma pele mais firme.',
                defaultPostProcedureInstructions: 'Manter a pele hidratada e usar protetor solar. Pode retomar as atividades normais imediatamente.',
                isActive: true,
            },
            {
                id: 'proc-default-11', name: 'Massagem Modeladora Localizada', category: 'Corporal', defaultPrice: 120, defaultCost: 15, defaultDuration: 60,
                technicalDescription: 'Massagem com movimentos rápidos e firmes que visa remodelar o contorno corporal, combater a celulite e a gordura localizada. Focada em áreas como abdômen, coxas e glúteos.',
                defaultPostProcedureInstructions: 'Beber muita água para ajudar a eliminar toxinas. Manter uma dieta equilibrada e praticar exercícios para potencializar os resultados.',
                isActive: true,
            },
            {
                id: 'proc-default-12', name: 'Drenagem Linfática Corporal', category: 'Corporal', defaultPrice: 140, defaultCost: 10, defaultDuration: 75,
                technicalDescription: 'Massagem suave e rítmica que estimula o sistema linfático a trabalhar de forma mais acelerada. Ajuda a reduzir o inchaço, eliminar toxinas e combater a celulite.',
                defaultPostProcedureInstructions: 'Ingerir bastante líquido. Evitar alimentos ricos em sódio. Repousar após a sessão se possível.',
                isActive: true,
            },
        ];
        
        await saveProcedures(userId, defaultProcedures);
        return Promise.resolve(defaultProcedures);
    }

    // If it's not the BOSS user and no procedures, return empty.
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
