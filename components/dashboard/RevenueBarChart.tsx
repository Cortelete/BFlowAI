import React from 'react';

interface RevenueBarChartProps {
    data: { [month: string]: number };
}

const RevenueBarChart: React.FC<RevenueBarChartProps> = ({ data }) => {
    const months = Object.keys(data);
    const values = Object.values(data);
    const maxValue = Math.max(...values, 1); // Avoid division by zero

    if(months.length === 0) {
        return <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Nenhum dado de faturamento para exibir o gráfico.</p>
    }

    return (
        <div className="mt-8 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Faturamento Mensal</h3>
            <div className="flex justify-around items-end h-64 gap-2">
                {months.map(month => (
                    <div key={month} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-brand-purple-300/50 dark:bg-brand-purple-700/50 rounded-t-lg hover:opacity-80 transition-opacity flex items-end" style={{ height: `${(data[month] / maxValue) * 100}%` }}>
                           <span className="text-xs text-white font-bold self-start p-1 bg-brand-purple-500/80 rounded-t-lg w-full text-center">
                                {data[month].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </span>
                        </div>
                        <div className="text-xs font-semibold mt-2 capitalize">{month}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevenueBarChart;
