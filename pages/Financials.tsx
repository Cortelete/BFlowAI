import React, { useMemo, useState } from 'react';
import type { Client, Expense, Transaction, User } from '../types';
import { Icon } from '../components/common/Icon';
import KpiCard from '../components/financials/KpiCard';
import CashFlowChart from '../components/financials/CashFlowChart';
import ExpenseModal from '../components/financials/ExpenseModal';
import { toast } from 'react-hot-toast';

interface FinancialsProps {
  clients: Client[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  currentUser: User;
}

type Period = 'month' | 'quarter' | 'year' | 'all';
type StatusFilter = 'all' | 'Pago' | 'Pendente' | 'Atrasado';
type TypeFilter = 'all' | 'Receita' | 'Despesa';

export const Financials: React.FC<FinancialsProps> = ({ clients, expenses, setExpenses }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const {
    totalRevenue,
    totalExpenses,
    netProfit,
    ticketMedium,
    pendingAmount,
    transactionCount,
    revenueByProcedure,
    filteredTransactions
  } = useMemo(() => {
    let allTransactions: Transaction[] = [];

    clients.forEach(client => {
      client.appointments.forEach(appt => {
        allTransactions.push({
          id: appt.id, date: appt.date, description: appt.procedureName || appt.procedure,
          clientName: client.name, type: 'Receita', amount: appt.finalValue || appt.price,
          profit: (appt.finalValue || appt.price) - appt.cost, status: appt.status, category: 'Procedimento'
        });
      });
    });

    expenses.forEach(expense => {
      allTransactions.push({
        id: expense.id, date: expense.date, description: expense.description, type: 'Despesa',
        amount: -expense.amount, status: 'N/A', category: expense.category,
      });
    });

    const now = new Date();
    const filtered = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      const tUtcDate = new Date(tDate.getUTCFullYear(), tDate.getUTCMonth(), tDate.getUTCDate());
      const nowUtc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      switch (period) {
        case 'month':
          return tUtcDate.getUTCMonth() === nowUtc.getUTCMonth() && tUtcDate.getUTCFullYear() === nowUtc.getUTCFullYear();
        case 'quarter':
          const currentQuarter = Math.floor(nowUtc.getUTCMonth() / 3);
          const tQuarter = Math.floor(tUtcDate.getUTCMonth() / 3);
          return tQuarter === currentQuarter && tUtcDate.getUTCFullYear() === nowUtc.getUTCFullYear();
        case 'year':
          return tUtcDate.getUTCFullYear() === nowUtc.getUTCFullYear();
        case 'all':
        default:
          return true;
      }
    });

    let rev = 0, exp = 0, pending = 0, revenueTxCount = 0;
    const procRevenue: { [name: string]: number } = {};

    filtered.forEach(t => {
      if (t.type === 'Receita' && t.status === 'Pago') rev += t.amount;
      if (t.type === 'Receita') {
        revenueTxCount++;
        if (t.status === 'Pendente' || t.status === 'Atrasado') pending += t.amount;
        procRevenue[t.description] = (procRevenue[t.description] || 0) + t.amount;
      }
      if (t.type === 'Despesa') exp += Math.abs(t.amount);
    });

    const revenueByProcedure = Object.entries(procRevenue).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return {
      filteredTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalRevenue: rev, totalExpenses: exp, netProfit: rev - exp, ticketMedium: revenueTxCount > 0 ? rev / revenueTxCount : 0,
      pendingAmount: pending, transactionCount: filtered.length, revenueByProcedure,
    };
  }, [clients, expenses, period]);

  const finalFilteredTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
        const statusMatch = statusFilter === 'all' || t.status === statusFilter;
        const typeMatch = typeFilter === 'all' || t.type === typeFilter;
        return statusMatch && typeMatch;
    });
  }, [filteredTransactions, statusFilter, typeFilter]);

  const handleSaveExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    toast.success("Despesa adicionada com sucesso!");
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch(status) {
        case 'Pago': return <Icon icon="check-circle" className="text-green-500"/>
        case 'Pendente': return <Icon icon="clock" className="text-yellow-500"/>
        case 'Atrasado': return <Icon icon="alert-circle" className="text-red-500"/>
        default: return null;
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Visão Financeira Inteligente</h2>
            <p className="text-gray-600 dark:text-gray-300">Seu painel completo de controle financeiro.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 p-1 rounded-full">
            {(['month', 'quarter', 'year', 'all'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${period === p ? 'bg-white dark:bg-gray-900 shadow text-brand-pink-500' : 'hover:bg-white/50 dark:hover:bg-black/50'}`}>
                {p === 'month' ? 'Este Mês' : p === 'quarter' ? 'Trimestre' : p === 'year' ? 'Este Ano' : 'Tudo'}
              </button>
            ))}
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all flex items-center gap-2">
            <Icon icon="plus" className="w-5 h-5"/> Adicionar Despesa
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <KpiCard title="Faturamento Pago" value={totalRevenue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="dollar-sign" color="bg-green-500 text-green-700 dark:text-green-300 border-green-500" />
            <KpiCard title="Despesas" value={totalExpenses.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="receipt" color="bg-red-500 text-red-700 dark:text-red-300 border-red-500" />
            <KpiCard title="Lucro Líquido" value={netProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="pie-chart" color="bg-blue-500 text-blue-700 dark:text-blue-300 border-blue-500" />
            <KpiCard title="Ticket Médio" value={ticketMedium.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="trending-up" color="bg-brand-purple-500 text-brand-purple-700 dark:text-brand-purple-300 border-brand-purple-500" />
            <KpiCard title="Pendentes" value={pendingAmount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} icon="wallet" color="bg-yellow-500 text-yellow-700 dark:text-yellow-300 border-yellow-500" />
            <KpiCard title="Transações" value={transactionCount.toString()} icon="list" color="bg-gray-500 text-gray-700 dark:text-gray-300 border-gray-500" />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
            <div className="xl:col-span-2 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Receita por Procedimento</h3>
                {revenueByProcedure.length > 0 ? (
                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {revenueByProcedure.map((item, index) => (
                            <li key={index} className="flex justify-between items-center text-sm">
                                <span>{item.name}</span>
                                <span className="font-bold">{item.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm italic text-center py-10">Nenhuma receita no período.</p>}
            </div>
             <div className="xl:col-span-3 bg-white/20 dark:bg-black/30 p-6 rounded-2xl shadow-lg">
                 <h3 className="text-xl font-semibold mb-4">Fluxo de Caixa</h3>
                <CashFlowChart transactions={filteredTransactions} period={period} />
            </div>
        </div>

        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h3 className="text-2xl font-bold font-serif">Histórico de Transações</h3>
                <div className="flex items-center gap-4">
                     <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)} className="bg-white/20 dark:bg-black/30 p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-brand-pink-300">
                        <option value="all">Todos os Tipos</option>
                        <option value="Receita">Receitas</option>
                        <option value="Despesa">Despesas</option>
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} className="bg-white/20 dark:bg-black/30 p-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-brand-pink-300">
                        <option value="all">Todos os Status</option>
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Atrasado">Atrasado</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg shadow-md max-h-[60vh] overflow-y-auto">
                <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                    <thead className="bg-white/30 dark:bg-gray-900/40 sticky top-0">
                        <tr>
                            {['Data', 'Descrição', 'Tipo', 'Valor', 'Status'].map(h => (
                                <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                        {finalFilteredTransactions.map((t) => (
                            <tr key={t.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                                <td className="py-4 px-6 whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                <td className="py-4 px-6 whitespace-nowrap font-medium">{t.description}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.type === 'Receita' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>{t.type}</span>
                                </td>
                                <td className={`py-4 px-6 font-bold ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {Math.abs(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="py-4 px-6 flex items-center gap-2">{getStatusIcon(t.status)} {t.status !== 'N/A' && t.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {finalFilteredTransactions.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6 p-8">Nenhuma transação encontrada com os filtros atuais.</p>}
            </div>
        </div>
      </div>
      <ExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} />
    </div>
  );
};