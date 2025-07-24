import React from 'react';
import type { User } from '../types';
import IdeaGenerator from '../components/ideas/IdeaGenerator';

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