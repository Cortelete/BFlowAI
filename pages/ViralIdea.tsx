import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/Icons';
import { generateViralIdea } from '../services/geminiService';
import type { ViralIdeaResponse, CreativeIdea, Trend } from '../types';

const SAVED_IDEAS_KEY = 'beautyflow_saved_viral_ideas';

// Card for the main Trend
const TrendCard: React.FC<{ trend: Trend }> = ({ trend }) => (
    <div className="bg-white/20 dark:bg-black/30 backdrop-blur-lg border border-white/20 dark:border-black/20 p-6 rounded-2xl shadow-lg animate-fade-in-up">
        <h3 className="text-2xl font-bold font-serif text-brand-purple-500 dark:text-brand-purple-300 mb-3 flex items-center">
            <Icon icon="trending-up" className="mr-3" />
            Tendência em Alta: {trend.title}
        </h3>
        <p className="text-sm italic mb-4">{trend.summary}</p>
        <p className="mb-4">{trend.analysis}</p>
        <div className="flex flex-wrap gap-2">
            <span className="font-semibold">Formatos:</span>
            {trend.formats.map((format, i) => (
                <span key={i} className="px-3 py-1 bg-brand-purple-100 dark:bg-brand-purple-900/50 text-brand-purple-800 dark:text-brand-purple-200 text-xs font-bold rounded-full">{format}</span>
            ))}
        </div>
    </div>
);

// Card for each Creative Idea
const IdeaCard: React.FC<{ idea: CreativeIdea; onSave: (idea: CreativeIdea) => void; isSaved: boolean }> = ({ idea, onSave, isSaved }) => {
    const copyToClipboard = () => {
        const textToCopy = `**Legenda Sugerida:**\n${idea.caption}\n\n**Hashtags:**\n${idea.hashtags.join(' ')}`;
        navigator.clipboard.writeText(textToCopy);
        toast.success("Estrutura copiada!");
    };

    return (
        <div className="bg-white/20 dark:bg-black/30 backdrop-blur-lg border border-white/20 dark:border-black/20 p-6 rounded-2xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-pink-300/50 animate-fade-in-up">
            <div>
                <h4 className="font-bold text-xl mb-2 text-gray-800 dark:text-white">{idea.title}</h4>
                <p className="text-xs font-semibold bg-brand-pink-100 text-brand-pink-800 px-2 py-0.5 rounded-full inline-block mb-3 dark:bg-brand-pink-500/30 dark:text-brand-pink-200">{idea.format}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{idea.description}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong className="text-gray-700 dark:text-gray-300">Legenda:</strong> {idea.caption}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4"><strong className="text-gray-700 dark:text-gray-300">CTA:</strong> {idea.cta}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                    {idea.hashtags.map((tag, i) => <span key={i} className="text-blue-500">{tag}</span>)}
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <button onClick={copyToClipboard} className="text-sm font-semibold text-brand-purple-600 dark:text-brand-purple-300 hover:underline">Copiar Estrutura</button>
                <button onClick={() => onSave(idea)} disabled={isSaved} className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">{isSaved ? 'Salva!' : 'Salvar Ideia'}</button>
            </div>
        </div>
    );
};

// Loading State Component
const LoadingState = () => (
    <div className="text-center p-8 animate-fade-in-up">
        <Icon icon="wand" className="mx-auto h-16 w-16 text-brand-purple-400 animate-spin-slow" />
        <h2 className="mt-4 text-2xl font-semibold">Analisando o universo de conteúdo...</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Nossa IA está escaneando tendências e buscando a próxima grande ideia para você!</p>
    </div>
);

export const ViralIdea: React.FC = () => {
    const [niche, setNiche] = useState('extensão de cílios');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ViralIdeaResponse | null>(null);
    const [savedIdeas, setSavedIdeas] = useState<CreativeIdea[]>([]);

    useEffect(() => {
        const storedIdeas = localStorage.getItem(SAVED_IDEAS_KEY);
        if (storedIdeas) {
            setSavedIdeas(JSON.parse(storedIdeas));
        }
    }, []);

    const handleSaveIdea = (ideaToSave: CreativeIdea) => {
        const isAlreadySaved = savedIdeas.some(idea => idea.id === ideaToSave.id);
        if (isAlreadySaved) {
            toast('Essa ideia já foi salva.');
            return;
        }
        const updatedIdeas = [...savedIdeas, ideaToSave];
        setSavedIdeas(updatedIdeas);
        localStorage.setItem(SAVED_IDEAS_KEY, JSON.stringify(updatedIdeas));
        toast.success('Ideia salva com sucesso!');
    };

    const handleGenerate = async () => {
        if (!niche.trim()) {
            toast.error("Por favor, defina um nicho de mercado.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await generateViralIdea(niche);
            setResult(response);
        } catch (e: any) {
            setError(e.message || "Ocorreu um erro desconhecido.");
            toast.error(e.message || "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 min-h-[80vh]">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-gray-800 dark:text-white mb-4">
                        Descubra sua Próxima Ideia Viral
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Digite seu nicho de mercado e deixe nossa IA analisar as tendências mais quentes para gerar ideias de conteúdo irresistíveis para você.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Ex: maquiagem, design de sobrancelhas..."
                            className="w-full sm:w-80 p-4 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-center"
                        />
                         <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-brand-pink-500 text-white font-bold rounded-full shadow-lg hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait animate-pulse-slow group"
                        >
                            <Icon icon="fire" className="h-6 w-6 group-hover:animate-bounce"/>
                            <span>{isLoading ? 'Analisando...' : 'Ver Ideia Viral Agora'}</span>
                        </button>
                    </div>
                </div>

                {isLoading && <LoadingState />}
                {error && <p className="text-center text-red-500 mt-4">{error}</p>}

                {result && (
                    <div className="space-y-8 mt-12">
                        <TrendCard trend={result.trend} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {result.creativeIdeas.map(idea => (
                                <IdeaCard key={idea.id} idea={idea} onSave={handleSaveIdea} isSaved={savedIdeas.some(saved => saved.id === idea.id)} />
                            ))}
                        </div>
                    </div>
                )}
                
                {savedIdeas.length > 0 && (
                     <div className="mt-16">
                        <h3 className="text-2xl font-bold font-serif text-center mb-6">Suas Ideias Salvas</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedIdeas.map(idea => (
                                <IdeaCard key={idea.id} idea={idea} onSave={handleSaveIdea} isSaved={true} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};