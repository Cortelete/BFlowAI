
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Appointment, Procedure, User, AnamnesisRecord, MaterialUsed, ProcedureImage } from '../types';
import { importFromExcel, createEmptyAppointment } from '../services/clientService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';

// --- HELPER FUNCTIONS & CONSTANTS ---
const emptyAnamnesisRecord: AnamnesisRecord = {
    healthHistory: { hypertension: false, diabetes: false, hormonalDisorders: false, epilepsy: false, heartDisease: false, autoimmuneDisease: false, respiratoryProblems: false, respiratoryAllergies: false, cancer: false, pacemaker: false, skinDisease: false, keloids: false, hepatitis: false, hiv: false, otherConditions: '' },
    medications: { currentMedications: '', roaccutane: false, contraceptive: false },
    allergies: { alcohol: false, latex: false, cosmetics: false, localAnesthetics: false, lashGlue: false, makeup: false, henna: false, otherAllergies: '' },
    aestheticHistory: {
        lashExtensions: { hasDoneBefore: false, hadReaction: false, reactionDescription: '', wearsContacts: false, usesEyeDrops: false },
        browDesign: { usedHenna: false, allergicReactions: '', hasScars: false },
        skinCare: { skinType: '', usesAcids: false, hadNeedling: false, recentProcedures: false }
    },
    careRoutine: { usesSunscreen: false, currentProducts: '' },
    professionalNotes: '', imageAuth: false, declaration: false
};
const emptyClient: Omit<Client, 'id' | 'appointments'> = { name: '', phone: '', email: '', birthDate: '', gender: 'Prefiro não dizer', cpf: '', photo: '', anamnesis: emptyAnamnesisRecord, profession: '', howTheyMetUs: '' };
type ClientStatus = 'Todos' | 'Ativos' | 'Inativos' | 'Aniversariantes';

const InputField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <input {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);
const TextAreaField = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <textarea {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500" />
    </div>
);

// --- PAGE COMPONENT ---
interface ClientsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    procedures: Procedure[];
    currentUser: User;
}

export const Clients: React.FC<ClientsProps> = ({ clients, setClients, procedures, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus>('Todos');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState(emptyClient);

  const getClientStatus = useCallback((client: Client): { text: string; color: string; } => {
    const today = new Date();
    if (client.appointments.length === 0) return { text: 'Novo', color: 'bg-blue-500' };
    const lastApptDate = new Date([...client.appointments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
    const diffDays = (today.getTime() - lastApptDate.getTime()) / (1000 * 3600 * 24);

    if (diffDays <= 30) return { text: 'Recente', color: 'bg-green-500' };
    if (diffDays <= 90) return { text: 'Ativo', color: 'bg-yellow-500' };
    return { text: 'Inativo', color: 'bg-red-500' };
  }, []);

  const filteredClients = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();

    return clients
      .filter(client => {
        const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (!searchMatch) return false;

        switch (statusFilter) {
          case 'Aniversariantes':
            if (!client.birthDate) return false;
            const birthDate = new Date(client.birthDate);
             // Adjust for timezone issues by only comparing month and day from UTC date
            const birthMonth = birthDate.getUTCMonth();
            return birthMonth === currentMonth;
          case 'Ativos':
            return getClientStatus(client).text !== 'Inativo';
          case 'Inativos':
            return getClientStatus(client).text === 'Inativo';
          case 'Todos':
          default:
            return true;
        }
      }).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm, statusFilter, getClientStatus]);

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDetailsModalOpen(true);
  };
  
  const handleAddClient = () => {
    if (!newClient.name || !newClient.phone) {
        toast.error('Nome e Telefone são obrigatórios.');
        return;
    }
    const clientToAdd: Client = { ...newClient, id: `client-${Date.now()}`, appointments: [] };
    setClients(prev => [clientToAdd, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    setNewClient(emptyClient);
    setAddModalOpen(false);
    toast.success(`${clientToAdd.name} foi adicionado(a) com sucesso!`);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Todos os seus dados serão perdidos permanentemente.")) {
      setClients(prev => prev.filter(c => c.id !== clientId));
      setDetailsModalOpen(false);
      toast.success("Cliente excluído com sucesso.");
    }
  };

  const handleSaveClientDetails = (updatedClient: Client) => {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      toast.success("Dados do cliente atualizados!");
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Importando planilha...');
    try {
      const importedClients = await importFromExcel(file);
      const existingNames = new Set(clients.map(c => c.name.toLowerCase()));
      const newUniqueClients = importedClients.filter(ic => !existingNames.has(ic.name.toLowerCase()));
      setClients(prev => [...prev, ...newUniqueClients].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`${newUniqueClients.length} novos clientes importados!`, { id: toastId });
    } catch (error) {
      toast.error(String(error), { id: toastId });
    }
    event.target.value = '';
  };
  
  const getAvatar = (client: Client) => {
      if (client.photo) return <img src={client.photo} alt={client.name} className="w-10 h-10 rounded-full object-cover"/>;
      const initials = client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return (
          <div className="w-10 h-10 rounded-full bg-brand-purple-500 text-white flex items-center justify-center font-bold text-sm">
              {initials}
          </div>
      );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Gestão de Clientes (CRM)</h2>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all" />
          <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 p-1 rounded-full">
            {(['Todos', 'Ativos', 'Inativos', 'Aniversariantes'] as ClientStatus[]).map(p => (
              <button key={p} onClick={() => setStatusFilter(p)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${statusFilter === p ? 'bg-white dark:bg-gray-900 shadow text-brand-pink-500' : 'hover:bg-white/50 dark:hover:bg-black/50'}`}>{p}</button>
            ))}
          </div>
          <div className='flex gap-2'>
            <label htmlFor="excel-upload" className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105 cursor-pointer text-center">Importar</label>
            <input id="excel-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
            <button onClick={() => setAddModalOpen(true)} className="w-full md:w-auto bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105">Adicionar</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                <thead className="bg-white/30 dark:bg-gray-900/40">
                    <tr>{['Cliente', 'Contato', 'Status', 'Última Visita', 'Ações'].map(h => <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                    {filteredClients.map(client => {
                        const status = getClientStatus(client);
                        const lastVisit = client.appointments.length > 0 ? new Date([...client.appointments].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';
                        return (
                            <tr key={client.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                                <td className="py-2 px-6"><div className="flex items-center gap-3"><div className="flex-shrink-0">{getAvatar(client)}</div><span>{client.name}</span></div></td>
                                <td className="py-4 px-6">{client.phone}</td>
                                <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}>{status.text}</span></td>
                                <td className="py-4 px-6">{lastVisit}</td>
                                <td className="py-4 px-6"><div className='flex gap-2 justify-start'>
                                    <button onClick={() => handleViewDetails(client)} className="bg-brand-purple-500 text-white p-2 rounded-lg shadow hover:bg-brand-purple-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 