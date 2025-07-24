import React, { useState, useMemo } from 'react';
import { generateMarketingContent } from '../services/geminiService';
import type { MessageCategory, Client, User } from '../types';
import { toast } from 'react-hot-toast';
import { useLimiter } from '../hooks/useLimiter';
import GenerationCard from '../components/communication/GenerationCard';
import PersonalizedAction from '../components/communication/PersonalizedAction';

const MAX_GENERATIONS_PER_DAY = 10;

export const Communication: React.FC<{ clients: Client[], currentUser: User }> = ({ clients, currentUser }) => {
    const [generatedMessage, setGeneratedMessage] = useState({ title: '', content: ''});
    const [isGenerating, setIsGenerating] = useState(false);

    const birthdayLimiter = useLimiter('birthday', currentUser.id, MAX_GENERATIONS_PER_DAY);
    const promoLimiter = useLimiter('promo', currentUser.id, MAX_GENERATIONS_PER_DAY);

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

    const upcomingBirthdays = useMemo(() => clients.filter(c => {
        if (!c.birthDate) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const [_year, month, day] = c.birthDate.split('-').map(Number);
        const birthDateThisYear = new Date(now.getFullYear(), month - 1, day);
        const diffDays = (birthDateThisYear.getTime() - now.getTime()) / (1000 * 3600 * 24);
        
        return diffDays >= 0 && diffDays <= 30;
    }).sort((a, b) => {
        const [_ay, am, ad] = a.birthDate!.split('-').map(Number);
        const [_by, bm, bd] = b.birthDate!.split('-').map(Number);
        if (am !== bm) return am - bm;
        return ad - bd;
    }), [clients]);

    const inactiveClients = useMemo(() => clients.filter(c => {
         if (c.appointments.length === 0) return false;
         const lastApptDate = new Date(c.appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
         const diffDays = (new Date().getTime() - lastApptDate.getTime()) / (1000 * 3600 * 24);
         return diffDays > 60 && diffDays < 365;
    }), [clients]);

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
                                <h4 className="font-bold mb-2">
                                    🎉 Próximos Aniversários
                                    <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">({birthdayLimiter.usage}/{MAX_GENERATIONS_PER_DAY})</span>
                                </h4>
                                <ul className="space-y-2 h-48 overflow-y-auto pr-2">
                                    {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(c => <PersonalizedAction key={c.id} client={c} actionType="birthday" onGenerate={handlePersonalizedGenerate} disabled={isGenerating || birthdayLimiter.isLimited} />) : <p className="text-sm italic opacity-70">Nenhum aniversário próximo.</p>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">
                                    💔 Clientes Inativos (60+ dias)
                                     <span className="text-sm font-normal ml-2 text-gray-500 dark:text-gray-400">({promoLimiter.usage}/{MAX_GENERATIONS_PER_DAY})</span>
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
                            placeholder="Clique em 'Gerar' ao lado de uma cliente para criar uma mensagem personalizada aqui."
                            rows={10}
                            className="w-full p-3 bg-white/30 dark:bg-black/40 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none resize-none transition-all"
                            onClick={(e) => { if(generatedMessage.content) { e.currentTarget.select(); navigator.clipboard.writeText(generatedMessage.content); toast.success("Mensagem copiada!"); }}}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};