
import React, { useState } from 'react';
import type { Procedure, User } from '../types';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';

interface ProceduresProps {
    procedures: Procedure[];
    setProcedures: React.Dispatch<React.SetStateAction<Procedure[]>>;
    currentUser: User;
}

const emptyProcedure: Omit<Procedure, 'id'> = { 
    name: '', 
    category: 'Geral',
    defaultPrice: 0, 
    defaultCost: 0, 
    defaultDuration: 60,
    technicalDescription: '',
    defaultPostProcedureInstructions: '',
    isActive: true,
};

const InputField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <input {...props} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);
const TextAreaField = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <textarea {...props} rows={3} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);
const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <select {...props} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500 appearance-none">
            {children}
        </select>
    </div>
);


const ProcedureCard: React.FC<{
    proc: Procedure;
    onEdit: (proc: Procedure) => void;
    onDelete: (id: string) => void;
    isBoss: boolean;
}> = ({ proc, onEdit, onDelete, isBoss }) => {
    return (
        <div className={`bg-white/20 dark:bg-black/30 backdrop-blur-lg border border-white/20 dark:border-black/20 p-5 rounded-2xl shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand-pink-300/50 ${!proc.isActive ? 'opacity-50' : ''}`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl mb-1 text-gray-800 dark:text-white truncate pr-2">{proc.name}</h3>
                    <span className="text-xs font-semibold bg-brand-purple-100 text-brand-purple-800 px-2 py-0.5 rounded-full dark:bg-brand-purple-500/30 dark:text-brand-purple-200 whitespace-nowrap">{proc.category}</span>
                </div>
                {!proc.isActive && <p className="text-xs text-red-500 font-semibold mb-2">Inativo</p>}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 min-h-[2.5rem]">{proc.technicalDescription || 'Sem descrição técnica.'}</p>
                <div className="space-y-2 text-sm border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                    <div className="flex items-center gap-2">
                        <Icon icon="dollar-sign" className="w-4 h-4 text-green-500" />
                        <span>Preço: <span className="font-semibold">{proc.defaultPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon="receipt" className="w-4 h-4 text-red-500" />
                        <span>Custo: <span className="font-semibold">{proc.defaultCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon="clock" className="w-4 h-4 text-blue-500" />
                        <span>Duração: <span className="font-semibold">{proc.defaultDuration} min</span></span>
                    </div>
                </div>
            </div>
            {isBoss && (
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button onClick={() => onEdit(proc)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">Editar</button>
                    <button onClick={() => onDelete(proc.id)} className="text-red-500 dark:text-red-400 hover:underline text-sm font-semibold">Excluir</button>
                </div>
            )}
        </div>
    );
};

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

    if (type === 'number') {
        finalValue = parseFloat(value) || 0;
    }
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
        finalValue = e.target.checked;
    }
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

        {procedures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {procedures.map((proc) => (
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={isEditing ? "Editar Procedimento" : "Adicionar Novo Procedimento"}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Informações Gerais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Título do Procedimento" name="name" value={currentProcedure.name} onChange={handleInputChange} />
                <SelectField label="Categoria" name="category" value={currentProcedure.category} onChange={handleInputChange}>
                    <option>Geral</option>
                    <option>Lash Design</option>
                    <option>Sobrancelha</option>
                    <option>Limpeza de Pele</option>
                    <option>Radiofrequência</option>
                    <option>Corporal</option>
                </SelectField>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="Preço Padrão (R$)" type="number" name="defaultPrice" value={currentProcedure.defaultPrice || ''} onChange={handleInputChange} />
                <InputField label="Custo Padrão (R$)" type="number" name="defaultCost" value={currentProcedure.defaultCost || ''} onChange={handleInputChange} />
                <InputField label="Duração Padrão (min)" type="number" name="defaultDuration" value={currentProcedure.defaultDuration || ''} onChange={handleInputChange} />
            </div>
             <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">Descrições Padrão</h4>
            <TextAreaField label="Descrição Técnica" name="technicalDescription" placeholder="Ex: Fio a Fio, Volume Híbrido, Dermaplaning, etc." value={currentProcedure.technicalDescription} onChange={handleInputChange} />
            <TextAreaField label="Cuidados Pós-Procedimento" name="defaultPostProcedureInstructions" placeholder="Ex: Não molhar por 24h, usar protetor solar..." value={currentProcedure.defaultPostProcedureInstructions} onChange={handleInputChange} />
             <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="isActive" name="isActive" checked={(currentProcedure as Procedure).isActive} onChange={handleInputChange} className="h-4 w-4 rounded text-brand-pink-500 focus:ring-brand-pink-500"/>
                <label htmlFor="isActive" className="font-semibold">Procedimento ativo no catálogo</label>
            </div>
            <button onClick={handleSave} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors mt-6">
              {isEditing ? "Salvar Alterações" : "Adicionar Procedimento"}
            </button>
        </div>
      </Modal>
    </div>
  );
};