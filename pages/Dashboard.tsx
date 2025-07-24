import React, { useMemo, useState, useEffect } from 'react';
import type { Client } from '../types';
import { Icon } from '../components/common/Icon';
import { EditableText } from '../components/EditableText';
import { generateDashboardSuggestion } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import StatCard from '../components/dashboard/StatCard';
import RevenueBarChart from '../components/dashboard/RevenueBarChart';

interface DashboardProps {
  clients: Client[];
  isBoss: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ clients, isBoss }) => {
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(true);

  const getNewSuggestion = async () => {
    setIsLoadingSuggestion(true);
    try {
        const newSuggestion = await generateDashboardSuggestion(clients);
        setSuggestion(newSuggestion);
    } catch(e) {
        toast.error("Falha ao gerar sugestão.");
    } finally {
        setIsLoadingSuggestion(false);
    }
  }

  useEffect(() => {
    if (clients.length > 0) {
        getNewSuggestion();
    }
  }, [clients]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalRevenue = 0;
    let appointmentsToday = 0;
    const recurringClients = new Set<string>();
    const monthlyRevenue: { [month: string]: number } = {};
    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    
    clients.forEach(client => {
        if(client.appointments.length > 1) {
            recurringClients.add(client.id);
        }
        client.appointments.forEach(appt => {
            const apptValue = appt.finalValue || appt.value || appt.price;
            if (appt.status === 'Pago') {
                totalRevenue += apptValue;

                const apptDate = new Date(appt.date);
                const utcDate = new Date(apptDate.getUTCFullYear(), apptDate.getUTCMonth(), apptDate.getUTCDate());
                const monthKey = monthFormatter.format(utcDate);
                monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + apptValue;
            }

            if (appt.date === today) {
                appointmentsToday++;
            }
        });
    });

    const recurrenceRate = clients.length > 0 ? (recurringClients.size / clients.length) * 100 : 0;

    return {
        totalClients: clients.length,
        totalRevenue: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        appointmentsToday,
        recurrenceRate: recurrenceRate.toFixed(0) + '%',
        monthlyRevenue
    }
  }, [clients]);

  return (
    <div className="p-4 md:p-6">
      <section className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-2">
            <EditableText textKey="dashboard_title" defaultValue="Dashboard de Sucesso" isBoss={isBoss} />
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
            <EditableText textKey="dashboard_subtitle" defaultValue="Bem-vinda! Aqui está um resumo do seu Luxury Studio de Beleza." isBoss={isBoss} />
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard 
            title="Total de Clientes"
            value={stats.totalClients.toString()}
            icon="clients"
            color="bg-brand-purple-500 text-brand-purple-700 dark:text-brand-purple-300 border-brand-purple-500"
            description="Clientes cadastradas na plataforma"
          />
          <StatCard 
            title="Faturamento (Pago)"
            value={stats.totalRevenue}
            icon="dollar-sign"
            color="bg-green-500 text-green-700 dark:text-green-300 border-green-500"
            description="Receita de agendamentos pagos"
          />
          <StatCard 
            title="Atendimentos Hoje"
            value={stats.appointmentsToday.toString()}
            icon="clock"
            color="bg-brand-pink-500 text-brand-pink-700 dark:text-brand-pink-300 border-brand-pink-500"
            description="Agendamentos para a data de hoje"
          />
          <StatCard 
            title="Taxa de Recorrência"
            value={stats.recurrenceRate}
            icon="recurrence"
            color="bg-blue-500 text-blue-700 dark:text-blue-300 border-blue-500"
            description="Clientes com mais de 1 agendamento"
          />
        </div>

        <RevenueBarChart data={stats.monthlyRevenue} />

        <div className="mt-8 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
            <div className='flex justify-between items-center mb-4'>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                    <Icon icon="wand" className="mr-2 text-brand-purple-500" />
                    <span>
                        <EditableText textKey="dashboard_actions_title" defaultValue="Sugestão da IA" isBoss={isBoss} />
                    </span>
                </h3>
                <button 
                    onClick={getNewSuggestion} 
                    disabled={isLoadingSuggestion}
                    className="bg-brand-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-purple-700 transition-all duration-300 transform hover:scale-105 text-sm disabled:opacity-50 disabled:cursor-wait">
                    {isLoadingSuggestion ? 'Pensando...' : 'Nova Sugestão'}
                </button>
            </div>
            {isLoadingSuggestion ? (
                 <p className="text-center text-gray-500 dark:text-gray-400 p-4">Analisando dados para gerar uma sugestão...</p>
            ) : (
                <p className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg transition hover:shadow-md text-gray-700 dark:text-gray-300 text-center text-lg">
                    {suggestion}
                </p>
            )}
        </div>
      </section>
    </div>
  );
};