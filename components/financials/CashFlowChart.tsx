import React, { useMemo } from 'react';
import type { Transaction } from '../../types';

type Period = 'month' | 'quarter' | 'year' | 'all';

interface CashFlowChartProps {
    transactions: Transaction[];
    period: Period;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions, period }) => {
    const dataPoints = useMemo(() => {
        const formatters = {
            month: new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: 'UTC' }),
            quarter: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }),
            year: new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }),
            all: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        };

        const groupedData: { [key: string]: { revenue: number, expense: number } } = {};
        
        transactions.forEach(t => {
            const date = new Date(t.date);
            const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            let key = '';
            if (period === 'month') key = `Dia ${formatters.month.format(utcDate)}`;
            else if (period === 'quarter') key = formatters.quarter.format(utcDate);
            else if (period === 'year') key = formatters.year.format(utcDate).replace('.', '');
            else key = formatters.all.format(utcDate);

            if (!groupedData[key]) {
                groupedData[key] = { revenue: 0, expense: 0 };
            }

            if (t.type === 'Receita') {
                groupedData[key].revenue += t.amount;
            } else {
                groupedData[key].expense += Math.abs(t.amount);
            }
        });
        
        const sortedKeys = Object.keys(groupedData).sort((a,b) => {
            // This is a simplified sort, works for month names but might need enhancement for more complex keys
            const monthOrder = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
            return monthOrder.indexOf(a.toLowerCase().split(' ')[0]) - monthOrder.indexOf(b.toLowerCase().split(' ')[0]);
        });

        return sortedKeys.map(key => ({
            label: key,
            revenue: groupedData[key].revenue,
            expense: groupedData[key].expense,
            profit: groupedData[key].revenue - groupedData[key].expense,
        }));
    }, [transactions, period]);

    if (dataPoints.length === 0) {
        return <p className="text-sm italic text-center py-10">Sem dados para exibir o fluxo de caixa.</p>;
    }

    const maxValue = Math.max(...dataPoints.flatMap(d => [d.revenue, d.expense, d.profit]), 1);

    return (
        <div className="w-full h-64 flex gap-2 items-end">
            {dataPoints.map((dp, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full h-full flex items-end gap-1 justify-center">
                       <div className="w-1/3 bg-green-500/50 rounded-t-md transition-all duration-300 group-hover:bg-green-500" style={{ height: `${(dp.revenue / maxValue) * 100}%` }}></div>
                       <div className="w-1/3 bg-red-500/50 rounded-t-md transition-all duration-300 group-hover:bg-red-500" style={{ height: `${(dp.expense / maxValue) * 100}%` }}></div>
                       <div className="w-1/3 bg-blue-500/50 rounded-t-md transition-all duration-300 group-hover:bg-blue-500" style={{ height: `${(dp.profit > 0 ? dp.profit / maxValue : 0) * 100}%` }}></div>
                    </div>
                    <span className="text-xs mt-1 font-semibold capitalize">{dp.label}</span>
                     <div className="absolute bottom-full mb-2 w-48 p-2 bg-black/70 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <p className="font-bold capitalize">{dp.label}</p>
                       <p><span className="text-green-400">■</span> Receita: {dp.revenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                       <p><span className="text-red-400">■</span> Despesa: {dp.expense.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                       <p><span className="text-blue-400">■</span> Lucro: {dp.profit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CashFlowChart;
