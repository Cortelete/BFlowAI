import React, { useState } from 'react';
import { generateBusinessIdea } from '../../services/geminiService';
import type { IdeaCategory } from '../../types';
import { useLimiter } from '../../hooks/useLimiter';
import { toast } from 'react-hot-toast';

const MAX_IDEAS_PER_DAY = 10;

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
    const { usage, recordUsage, isLimited } = useLimiter(category, userId, MAX_IDEAS_PER_DAY);

    const handleGenerate = async () => {
        if (isLimited) {
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
                 onClick={(e) => { if(idea) {e.currentTarget.select(); navigator.clipboard.writeText(idea); toast.success("Ideia copiada!");} }}
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || isLimited}
                className={`w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading || isLimited ? 'bg-gray-500' : 'bg-brand-purple-500 hover:bg-brand-purple-700'}`}
            >
                {isLoading ? 'Criando...' : buttonText}
            </button>
            <p className="text-xs text-center mt-3 opacity-70">Uso hoje: {usage}/{MAX_IDEAS_PER_DAY}</p>
        </div>
    );
};

export default IdeaGenerator;
