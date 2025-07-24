import React from 'react';
import type { Client, MessageCategory } from '../../types';

interface PersonalizedActionProps {
    client: Client;
    actionType: 'birthday' | 'promo';
    onGenerate: (client: Client, type: MessageCategory) => void;
    disabled: boolean;
}

const PersonalizedAction: React.FC<PersonalizedActionProps> = ({ client, actionType, onGenerate, disabled }) => {
    const isBirthday = actionType === 'birthday';
    const birthDateDayMonth = isBirthday && client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' }) : '';
    
    const lastVisitDays = () => {
        if (client.appointments.length === 0) return null;
        const lastApptDate = new Date(client.appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
        return Math.floor((new Date().getTime() - lastApptDate.getTime()) / (1000 * 3600 * 24));
    }

    return (
        <li className={`p-3 rounded-lg flex justify-between items-center transition hover:shadow-md ${isBirthday ? 'bg-yellow-100 dark:bg-yellow-500/20' : 'bg-purple-100 dark:bg-brand-purple-500/20'}`}>
            <div>
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm opacity-70">{isBirthday ? `Aniversário em ${birthDateDayMonth}` : `Última visita há ${lastVisitDays()} dias`}</p>
            </div>
            <button onClick={() => onGenerate(client, isBirthday ? 'birthday' : 'promo')} disabled={disabled} className="bg-brand-pink-500 text-white font-bold text-xs py-1 px-3 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Gerar
            </button>
        </li>
    )
}

export default PersonalizedAction;
