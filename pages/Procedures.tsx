import React, { useState, useMemo } from 'react';
import type { Procedure, User } from '../types';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/common/Icon';
import ProcedureCard from '../components/procedures/ProcedureCard';
import ProcedureModal from '../components/procedures/ProcedureModal';

const emptyProcedure: Omit<Procedure, 'id'> = { 
    name: '', category: 'Geral', defaultPrice: 0, defaultCost: 0, 
    defaultDuration: 60, technicalDescription: '',
    defaultPostProcedureInstructions: '', isActive: true,
};

interface ProceduresProps {
    procedures: Procedure[];
    setProcedures: React.Dispatch<React.SetStateAction<Procedure[]>>;
    currentUser: User;
}

export const Procedures: React.FC<ProceduresProps> = ({ procedures, setProcedures, currentUser }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentProcedure, setCurrentProcedure] = useState<Procedure | Omit<Procedure, 'id'>>(emptyProcedure);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(procedures.map(p => p.category)))], [procedures]);

  const filteredProcedures = useMemo(() => {
    if (categoryFilter === 'Todos') return procedures;
    return procedures.filter(p => p.category === categoryFilter);
  }, [procedures, categoryFilter]);

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

    const sortedProcedures = (procs: Procedure[]) => procs.sort((a, b) => a.name.localeCompare(b.name));

    if (isEditing) {
        setProcedures(prev => sortedProcedures(prev.map(p => p.id === (currentProcedure as Procedure).id ? (currentProcedure as Procedure) : p)));
        toast.success("Procedimento atualizado!");
    } else {
        const newProc: Procedure = { id: `proc-${Date.now()}`, ...(currentProcedure as Omit<Procedure, 'id'>) };
        setProcedures(prev => sortedProcedures([...prev, newProc]));
        toast.success("Procedimento adicionado!");
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita e pode afetar agendamentos existentes.")) {
        setProcedures(prev => prev.filter(p => p.id !== id));
        toast.success("Procedimento excluído.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;

    if (type === 'number') finalValue = parseFloat(value) || 0;
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') finalValue = e.target.checked;
    
    setCurrentProcedure(prev => ({ ...prev, [name]: finalValue }));
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Gerenciar Procedimentos</h2>
            {currentUser.isBoss && (
                <button
                    onClick={openModalForAdd}
                    className="bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                    <Icon icon="plus" className="w-5 h-5" /> Adicionar Procedimento
                </button>
            )}
        </div>

        <div className="mb-6 flex items-center gap-2 bg-white/20 dark:bg-black/30 p-1 rounded-full overflow-x-auto">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${categoryFilter === cat ? 'bg-white dark:bg-gray-900 shadow text-brand-pink-500' : 'hover:bg-white/50 dark:hover:bg-black/50'}`}>{cat}</button>
            ))}
        </div>


        {filteredProcedures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProcedures.map((proc) => (
                    <ProcedureCard 
                        key={proc.id} 
                        proc={proc} 
                        onEdit={openModalForEdit} 
                        onDelete={handleDelete}
                        isBoss={currentUser.isBoss || false} 
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-16 px-6 bg-white/10 rounded-2xl">
                <Icon icon="clipboard" className="mx-auto h-16 w-16 text-brand-purple-300 opacity-50" />
                <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Nenhum Procedimento Cadastrado</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Comece adicionando os serviços que seu studio oferece.</p>
                {currentUser.isBoss && (
                     <button
                        onClick={openModalForAdd}
                        className="mt-6 bg-brand-pink-500 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all"
                    >
                        Adicionar Primeiro Procedimento
                    </button>
                )}
            </div>
        )}
      </div>

      <ProcedureModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isEditing={isEditing}
        currentProcedure={currentProcedure}
        handleInputChange={handleInputChange}
      />
    </div>
  );
};