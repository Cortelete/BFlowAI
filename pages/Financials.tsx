import React, { useMemo } from 'react';
import type { Client, FinancialEntry } from '../types';
import { Icon } from '../components/Icons';

interface FinancialsProps {
  clients: Client[];
}

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string; }> = ({ title, value, icon, color }) => (
  <div className={`bg-opacity-20 backdrop-blur-lg border border-opacity-30 p-6 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${color}`}>
    <div className="flex justify-between items-center">
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-3xl font-bold font-serif">{value}</p>
        </div>
        <div className="text-4xl opacity-70">
            <Icon icon={icon} />
        </div>
    </div>
  </div>
);

const RevenuePieChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    if (data.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 my-4">Nenhum dado para exibir o gráfico de pizza.</p>;
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#F962A2', '#9B59B6', '#F1C40F', '#3498DB', '#1ABC9C', '#E74C3C'];
    let cumulativePercent = 0;

    const gradients = data.map((item, index) => {
        const percent = (item.value / total) * 100;
        const start = cumulativePercent;
        cumulativePercent += percent;
        return `${colors[index % colors.length]} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
        <div className="mt-8 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center gap-6">
            <div
                className="w-48 h-48 rounded-full"
                style={{ background: `conic-gradient(${gradients})` }}
                role="img"
                aria-label="Gráfico de pizza do faturamento por procedimento"
            ></div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Faturamento por Procedimento</h3>
                <ul className="space-y-2">
                    {data.map((item, index) => (
                        <li key={item.name} className="flex items-center text-sm">
                            <span className="h-4 w-4 rounded-sm mr-2" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className="font-semibold">{item.name}:</span>
                            <span className="ml-auto">{item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export const Financials: React.FC<FinancialsProps> = ({ clients }) => {
  
  const { financialData, totalRevenue, totalCost, netProfit, revenueByProcedure } = useMemo(() => {
    const data: FinancialEntry[] = [];
    let rev = 0;
    let cost = 0;
    const procRevenue: { [name: string]: number } = {};

    clients.forEach(client => {
      client.appointments.forEach(appt => {
        const profit = appt.price - appt.cost;
        data.push({
          ...appt,
          clientName: client.name,
          profit: profit,
        });
        rev += appt.price;
        cost += appt.cost;

        procRevenue[appt.procedure] = (procRevenue[appt.procedure] || 0) + appt.price;
      });
    });

    const revenueByProcedure = Object.entries(procRevenue)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);


    return {
      financialData: data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalRevenue: rev,
      totalCost: cost,
      netProfit: rev - cost,
      revenueByProcedure
    };
  }, [clients]);

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Visão Financeira</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Faturamento Total" value={totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="dollar-sign" color="bg-green-500 text-green-700 dark:text-green-300 border-green-500" />
            <StatCard title="Custos Totais" value={totalCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="dollar-sign" color="bg-red-500 text-red-700 dark:text-red-400 border-red-500" />
            <StatCard title="Lucro Líquido" value={netProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="dollar-sign" color="bg-blue-500 text-blue-700 dark:text-blue-300 border-blue-500" />
        </div>

        <RevenuePieChart data={revenueByProcedure} />

        <h3 className="text-2xl font-bold font-serif text-gray-800 dark:text-white mb-4 mt-8">Histórico de Transações</h3>
        <div className="overflow-x-auto rounded-lg shadow-md max-h-[60vh] overflow-y-auto">
            <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                <thead className="bg-white/30 dark:bg-gray-900/40 sticky top-0">
                    <tr>
                        {['Data', 'Cliente', 'Procedimento', 'Faturamento', 'Custo', 'Lucro'].map(h => (
                            <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                    {financialData.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                            <td className="py-4 px-6 whitespace-nowrap">{new Date(entry.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                            <td className="py-4 px-6 whitespace-nowrap font-medium">{entry.clientName}</td>
                            <td className="py-4 px-6 whitespace-nowrap">{entry.procedure}</td>
                            <td className="py-4 px-6 text-green-600 dark:text-green-400">{entry.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="py-4 px-6 text-red-600 dark:text-red-400">{entry.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="py-4 px-6 text-blue-600 dark:text-blue-400 font-bold">{entry.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {financialData.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6 p-8">Nenhuma transação registrada. Adicione agendamentos aos seus clientes para começar.</p>}
      </div>
    </div>
  );
};