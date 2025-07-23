import React, { useState, useMemo } from 'react';
import type { Procedure, User } from '../types';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';


interface ProceduresProps {
    procedures: Procedure[];
    setProcedures: React.Dispatch<React.SetStateAction<Procedure[]>>;
    currentUser: User;
}

const emptyProcedure: Omit<Procedure, 'id'> = { name: '', defaultPrice: 0, defaultCost: 0, defaultDuration: 60 };

export const Procedures: React.FC<ProceduresProps> = ({ procedures, setProcedures, currentUser }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<Procedure | Omit<Procedure, 'id'>>(emptyProcedure);
  const [isEditing, setIsEditing] = useState(false);

  const openModalForAdd = () => {
    setCurrentProcedure(emptyProcedure);
    setIsEditing(false);
    setModalOpen(true);
  };
  
  const openModalForEdit = (proc: Procedure) => {
    setCurrentProcedure(proc);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!currentProcedure.name) {
        toast.error("O nome do procedimento é obrigatório.");
        return;
    }

    if (isEditing) {
        // Update existing procedure
        setProcedures(prev => prev.map(p => p.id === (currentProcedure as Procedure).id ? (currentProcedure as Procedure) : p));
        toast.success("Procedimento atualizado!");
    } else {
        // Add new procedure
        const newProc: Procedure = { id: `proc-${Date.now()}`, ...currentProcedure };
        setProcedures(prev => [...prev, newProc].sort((a,b) => a.name.localeCompare(b.name)));
        toast.success("Procedimento adicionado!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.")) {
        setProcedures(prev => prev.filter(p => p.id !== id));
        toast.success("Procedimento excluído.");
    }
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Gerenciar Procedimentos</h2>
            {currentUser.isBoss && (
                <button
                    onClick={openModalForAdd}
                    className="bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105"
                >
                    Adicionar Procedimento
                </button>
            )}
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                <thead className="bg-white/30 dark:bg-gray-900/40">
                    <tr>
                        {['Nome', 'Preço Padrão', 'Custo Padrão', 'Duração (min)', currentUser.isBoss ? 'Ações' : ''].map(h => (
                            <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                    {procedures.map((proc) => (
                        <tr key={proc.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                            <td className="py-4 px-6 whitespace-nowrap font-medium">{proc.name}</td>
                            <td className="py-4 px-6">{proc.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="py-4 px-6">{proc.defaultCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="py-4 px-6">{proc.defaultDuration} min</td>
                            {currentUser.isBoss && (
                                <td className="py-4 px-6">
                                    <div className="flex gap-2">
                                        <button onClick={() => openModalForEdit(proc)} className="text-blue-600 hover:text-blue-800">Editar</button>
                                        <button onClick={() => handleDelete(proc.id)} className="text-red-500 hover:text-red-700">Excluir</button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {procedures.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6 p-8">Nenhum procedimento cadastrado.</p>}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={isEditing ? "Editar Procedimento" : "Adicionar Procedimento"}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
            <input type="text" placeholder="Nome do Procedimento" value={currentProcedure.name} onChange={e => setCurrentProcedure({...currentProcedure, name: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="number" placeholder="Preço Padrão (R$)" value={currentProcedure.defaultPrice || ''} onChange={e => setCurrentProcedure({...currentProcedure, defaultPrice: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="number" placeholder="Custo Padrão (R$)" value={currentProcedure.defaultCost || ''} onChange={e => setCurrentProcedure({...currentProcedure, defaultCost: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="number" placeholder="Duração Padrão (minutos)" value={currentProcedure.defaultDuration || ''} onChange={e => setCurrentProcedure({...currentProcedure, defaultDuration: parseInt(e.target.value) || 0})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <button onClick={handleSave} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors">
              {isEditing ? "Salvar Alterações" : "Adicionar Procedimento"}
            </button>
        </div>
      </Modal>
    </div>
  );
};