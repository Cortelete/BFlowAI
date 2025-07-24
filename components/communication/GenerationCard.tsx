import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import type { MessageCategory } from '../../types';
import { useLimiter } from '../../hooks/useLimiter';
import { generateMarketingContent } from '../../services/geminiService';

const MAX_GENERATIONS_PER_DAY = 10;

interface GenerationCardProps {
    title: string;
    description: string;
    category: MessageCategory;
    buttonText: string;
    color: string;
    userId: string;
}

const GenerationCard: React.FC<GenerationCardProps> = ({ title, description, category, buttonText, color, userId }) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { usage, recordUsage, isLimited } = useLimiter(category, userId, MAX_GENERATIONS_PER_DAY);

    const handleGenerate = async () => {
        if(isLimited) {
            toast.error(`Você atingiu o limite de ${MAX_GENERATIONS_PER_DAY} gerações para esta categoria hoje.`);
            return;
        }
        if(recordUsage()) {
            setIsLoading(true);
            const result = await generateMarketingContent(category);
            setMessage(result);
            setIsLoading(false);
        }
    };

    return (
        <div className={`bg-opacity-20 backdrop-blur-lg border border-opacity-30 p-6 rounded-2xl shadow-lg ${color}`}>
            <h3 className="text-2xl font-semibold font-serif mb-2">{title}</h3>
            <p className="text-sm opacity-80 mb-4">{description}</p>
            <textarea
                value={isLoading ? 'Gerando com a magia da IA...' : message}
                readOnly
                placeholder="Sua mensagem gerada por IA aparecerá aqui..."
                rows={5}
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none resize-none transition-all mb-4"
                onClick={(e) => { if(message) { e.currentTarget.select(); navigator.clipboard.writeText(message); toast.success("Mensagem copiada!"); } }}
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || isLimited}
                className={`w-full text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isLoading || isLimited ? 'bg-gray-500' : 'bg-brand-pink-500 hover:bg-brand-pink-700'}`}
            >
                {isLoading ? 'Gerando...' : buttonText}
            </button>
            <p className="text-xs text-center mt-3 opacity-70">Uso hoje: {usage}/{MAX_GENERATIONS_PER_DAY}</p>
        </div>
    );
};

export default GenerationCard;
