import React, { useState, useCallback, useEffect } from 'react';
import { generateMarketingContent } from '../services/geminiService';
import type { MessageCategory, Client, User } from '../types';
import { toast } from 'react-hot-toast';

const MAX_GENERATIONS_PER_DAY = 10;

const useMessageLimiter = (category: MessageCategory, userId: string) => {
    const key = `beautyflow_comm_usage_${userId}_${category}`;
    
    const getUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem(key);
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) return data.count;
        }
        return 0;
    }, [key]);

    const [usage, setUsage] = useState(getUsage);

    useEffect(() => { setUsage(getUsage()); }, [getUsage]);

    const recordUsage = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const currentCount = getUsage();
        if (currentCount < MAX_GENERATIONS_PER_DAY) {
            const newCount = currentCount + 1;
            localStorage.setItem(key, JSON.stringify({ date: today, count: newCount }));
            setUsage(newCount);
            return true;
        }
        return false;
    }, [getUsage, key]);

    return { usage, recordUsage, isLimited: usage >= MAX_GENERATIONS_PER_DAY };
};


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
    const { usage, recordUsage, isLimited } = useMessageLimiter(category, userId);

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
                onClick={(e) => { e.currentTarget.select(); navigator.clipboard.writeText(message); toast.success("Mensagem copiada!"); }}
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

const PersonalizedAction: React.FC<{ client: Client; actionType: 'birthday' | 'promo'; onGenerate: (client: Client, type: MessageCategory) => void; disabled: boolean }> = ({ client, actionType, onGenerate, disabled }) => {
    const isBirthday = actionType === 'birthday';
    return (
        <li className={`p-3 rounded-lg flex justify-between items-center transition hover:shadow-md ${isBirthday ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-purple-100 dark:bg-brand-purple-500/20'}`}>
            <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm opacity-70">{isBirthday ? `Aniversário em ${new Date(client.birthDate!).toLocaleDateString('pt-BR',{ timeZone: 'UTC' })}` : `Última visita há ${Math.floor((new Date().getTime() - new Date(client.appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).getTime()) / (1000 * 3600 * 24))} dias`}</p>
            </div>
            <button onClick={() => onGenerate(client, isBirthday ? 'birthday' : 'promo')} disabled={disabled} className="bg-brand-pink-500 text-white font-bold text-xs py-1 px-3 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Gerar
            </button>
        </li>
    )
}


export const Communication: React.FC<{ clients: Client[], currentUser: User }> = ({ clients, currentUser }) => {
    const [generatedMessage, setGeneratedMessage] = useState({ title: '', content: ''});
    const [isGenerating, setIsGenerating] = useState(false);

    const birthdayLimiter = useMessageLimiter('birthday', currentUser.id);
    const promoLimiter = useMessageLimiter('promo', currentUser.id);

    const handlePersonalizedGenerate = async (client: Client, type: MessageCategory) => {
        const isBirthday = type === 'birthday';
        const limiter = isBirthday ? birthdayLimiter : promoLimiter;

        if (limiter.isLimited) {
            toast.error(`Você atingiu o limite de ${MAX_GENERATIONS_PER_DAY} gerações para esta categoria hoje.`);
            return;
        }

        if (limiter.recordUsage()) {
            setIsGenerating(true);
            setGeneratedMessage({ title: `Gerando para ${client.name}...`, content: ''});
            const content = await generateMarketingContent(type, client.name);
            setGeneratedMessage({ title: `Mensagem para ${client.name}`, content });
            setIsGenerating(false);
        }
    }

    const upcomingBirthdays = clients.filter(c => {
        if (!c.birthDate) return false;
        const now = new Date();
        const birthDate = new Date(c.birthDate);
        // Compare month and day, ignoring year, for the next 30 days
        const birthDayThisYear = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const diff = (birthDayThisYear.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 30;
    }).sort((a,b) => new Date(a.birthDate!).getMonth() - new Date(b.birthDate!).getMonth() || new Date(a.birthDate!).getDate() - new Date(b.birthDate!).getDate());

    const inactiveClients = clients.filter(c => {
         if (c.appointments.length === 0) return false; // Not considered inactive if they never came
         const lastApptDate = new Date(c.appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
         const diffDays = (new Date().getTime() - lastApptDate.getTime()) / (1000 * 3600 * 24);
         return diffDays > 60 && diffDays < 365; // Inactive for 2-12 months
    });

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-2">Comunicação & Marketing 💬</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Mantenha contato com suas clientes e atraia novas com mensagens inteligentes geradas pela IA.
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <GenerationCard userId={currentUser.id} title="Dica do Dia ☀️" description="Gere uma dica de beleza ou cuidado para postar nas redes sociais ou enviar para suas clientes." category="daily" buttonText="Gerar Dica" color="border-yellow-500 text-yellow-700 dark:text-yellow-300"/>
                    <GenerationCard userId={currentUser.id} title="Atrair Novas Clientes 🎯" description="Crie uma mensagem de prospecção para atrair pessoas que ainda não conhecem seu studio." category="prospect" buttonText="Gerar Mensagem" color="border-brand-purple-500 text-brand-purple-700 dark:text-brand-purple-300"/>
                    <GenerationCard userId={currentUser.id} title="Reativar Clientes 🔄" description="Gere uma mensagem especial para clientes que não agendam um horário há algum tempo." category="promo" buttonText="Gerar Promoção" color="border-green-500 text-green-700 dark:text-green-300"/>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
                         <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Ações Personalizadas</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold mb-2 flex justify-between items-center">
                                    <span>🎉 Aniversariantes do Mês</span>
                                    <span className="text-xs font-normal opacity-70">Uso: {birthdayLimiter.usage}/{MAX_GENERATIONS_PER_DAY}</span>
                                </h4>
                                <ul className="space-y-2 h-48 overflow-y-auto pr-2">
                                    {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(c => <PersonalizedAction key={c.id} client={c} actionType="birthday" onGenerate={handlePersonalizedGenerate} disabled={isGenerating || birthdayLimiter.isLimited} />) : <p className="text-sm italic opacity-70">Nenhum aniversário próximo.</p>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2 flex justify-between items-center">
                                    <span>💔 Clientes Inativos (60+ dias)</span>
                                    <span className="text-xs font-normal opacity-70">Uso: {promoLimiter.usage}/{MAX_GENERATIONS_PER_DAY}</span>
                                </h4>
                                 <ul className="space-y-2 h-48 overflow-y-auto pr-2">
                                    {inactiveClients.length > 0 ? inactiveClients.map(c => <PersonalizedAction key={c.id} client={c} actionType="promo" onGenerate={handlePersonalizedGenerate} disabled={isGenerating || promoLimiter.isLimited} />) : <p className="text-sm italic opacity-70">Nenhum cliente inativo.</p>}
                                </ul>
                            </div>
                         </div>
                    </div>
                    <div className="bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{generatedMessage.title || 'Mensagem Gerada'}</h3>
                        <textarea
                            value={isGenerating ? 'Gerando...' : generatedMessage.content}
                            readOnly
                            placeholder="Clique em 'Gerar' ao lado de um cliente para criar uma mensagem personalizada aqui."
                            rows={10}
                            className="w-full p-3 bg-white/30 dark:bg-black/40 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none resize-none transition-all"
                            onClick={(e) => { e.currentTarget.select(); navigator.clipboard.writeText(generatedMessage.content); toast.success("Mensagem copiada!"); }}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
