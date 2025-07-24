import React, { useState, useCallback, useEffect } from 'react';
import { generateBusinessIdea } from '../services/geminiService';
import type { IdeaCategory, User } from '../types';
import { toast } from 'react-hot-toast';

const MAX_IDEAS_PER_DAY = 10;

// Helper to manage usage limits in localStorage per user
const useIdeaLimiter = (category: IdeaCategory, userId: string) => {
    const key = `beautyflow_idea_usage_${userId}_${category}`;
    
    const getUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(key);
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                return data.count;
            }
        }
        return 0; // No usage today
    }, [key]);

    const [usage, setUsage] = useState(getUsage);

    useEffect(() => {
        setUsage(getUsage());
    }, [getUsage]);

    const recordUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentCount = getUsage();
        if (currentCount < MAX_IDEAS_PER_DAY) {
            const newCount = currentCount + 1;
            localStorage.setItem(key, JSON.stringify({ date: today, count: newCount }));
            setUsage(newCount);
            return true;
        }
        return false;
    }, [getUsage, key]);

    return { usage, recordUsage };
};

interface IdeaGeneratorProps {
    title: string;
    description: string;
    category: IdeaCategory;
    buttonText: string;
    color: string;
    userId: string;
}

const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ title, description, category, buttonText, color, userId }) => {
    const [idea, setIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { usage, recordUsage } = useIdeaLimiter(category, userId);
    const limitReached = usage >= MAX_IDEAS_PER_DAY;

    const handleGenerate = async () => {
        if (limitReached) {
            toast.error(`Você atingiu o limite de ${MAX_IDEAS_PER_DAY} ideias de ${category} por hoje. Volte amanhã!`);
            return;
        }

        if (recordUsage()) {
            setIsLoading(true);
            const result = await generateBusinessIdea(category);
            setIdea(result);
            setIsLoading(false);
        }
    };

    return (
        <div className={`bg-opacity-20 backdrop-blur-lg border border-opacity-30 p-6 rounded-2xl shadow-lg ${color}`}>
            <h3 className="text-2xl font-semibold font-serif mb-2">{title}</h3>
            <p className="text-sm opacity-80 mb-4">{description}</p>
            <textarea
                value={isLoading ? 'Nossa IA está pensando na ideia perfeita...' : idea}
                readOnly
                placeholder="Sua próxima grande ideia aparecerá aqui..."
                rows={4}
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none resize-none transition-all mb-4"
                 onClick={(e) => { e.currentTarget.select(); navigator.clipboard.writeText(idea); toast.success("Ideia copiada!"); }}
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || limitReached}
                className={`w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading || limitReached ? 'bg-gray-500' : 'bg-brand-purple-500 hover:bg-brand-purple-700'}`}
            >
                {isLoading ? 'Criando...' : buttonText}
            </button>
            <p className="text-xs text-center mt-3 opacity-70">Uso hoje: {usage}/{MAX_IDEAS_PER_DAY}</p>
        </div>
    );
};

export const Ideas: React.FC<{currentUser: User}> = ({currentUser}) => {
    return (
        <div className="p-4 md:p-6">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-2">Ideias & Otimização 💡</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Seu consultor de negócios particular, sempre com novidades e estratégias para seu studio.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <IdeaGenerator
                        userId={currentUser.id}
                        title="Dicas de Software 💻"
                        description="Receba sugestões de softwares e apps para otimizar a gestão do seu negócio."
                        category="software"
                        buttonText="Gerar Dica de Software"
                        color="border-blue-500 text-blue-700 dark:text-blue-300"
                    />
                    <IdeaGenerator
                        userId={currentUser.id}
                        title="Ideias de Marketing 🌟"
                        description="Gere ideias criativas de marketing para atrair e fidelizar mais clientes."
                        category="marketing"
                        buttonText="Gerar Ideia de Marketing"
                        color="border-brand-gold-500 text-brand-gold-700 dark:text-brand-gold-300"
                    />
                </div>
            </div>
        </div>
    );
};
