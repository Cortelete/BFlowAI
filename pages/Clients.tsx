import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Appointment, Procedure, AnamnesisRecord } from '../types';
import { importFromExcel } from '../services/clientService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

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
const emptyClient: Omit<Client, 'id' | 'appointments'> = { name: '', phone: '', email: '', birthDate: '', gender: 'Prefiro não dizer', cpf: '', photo: '', anamnesis: emptyAnamnesisRecord };
const emptyAppointment: Omit<Appointment, 'id'> = { date: '', time: '', procedure: '', price: 0, cost: 0, duration: 60, status: 'Pendente' };
type ClientStatus = 'Todos' | 'Ativos' | 'Inativos' | 'Aniversariantes';

// --- PAGE COMPONENT ---
interface ClientsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    procedures: Procedure[];
}

export const Clients: React.FC<ClientsProps> = ({ clients, setClients, procedures }) => {
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
            const birthMonth = new Date(client.birthDate).getMonth();
            return birthMonth === currentMonth;
          case 'Ativos':
            return getClientStatus(client).text !== 'Inativo';
          case 'Inativos':
            return getClientStatus(client).text === 'Inativo';
          case 'Todos':
          default:
            return true;
        }
      });
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
                                    <button onClick={() => handleViewDetails(client)} className="bg-brand-purple-500 text-white p-2 rounded-lg shadow hover:bg-brand-purple-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="bg-red-500 text-white p-2 rounded-lg shadow hover:bg-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                </div></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        {clients.length > 0 && filteredClients.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6">Nenhum cliente encontrado.</p>}
        {clients.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6 p-8">Nenhum cliente cadastrado.</p>}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Novo Cliente">
        <div className="space-y-4">
            <input type="text" placeholder="Nome Completo *" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="text" placeholder="Telefone *" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="email" placeholder="E-mail" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <input type="date" value={newClient.birthDate} max={new Date().toISOString().split("T")[0]} onChange={e => setNewClient({...newClient, birthDate: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <button onClick={handleAddClient} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700">Salvar Cliente</button>
        </div>
      </Modal>

      {isDetailsModalOpen && selectedClient && <ClientDetailsModal client={selectedClient} procedures={procedures} onClose={() => setDetailsModalOpen(false)} onSave={handleSaveClientDetails} setClients={setClients} />}
    </div>
  );
};


// --- DETAILS MODAL SUB-COMPONENT ---
interface ClientDetailsModalProps {
    client: Client;
    procedures: Procedure[];
    onClose: () => void;
    onSave: (client: Client) => void;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, procedures, onClose, onSave, setClients }) => {
    const [editedClient, setEditedClient] = useState<Client>(JSON.parse(JSON.stringify(client)));
    const [activeTab, setActiveTab] = useState<'info' | 'anamnesis' | 'history'>('info');
    const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id'>>(emptyAppointment);

    useEffect(() => {
        const selectedProc = procedures.find(p => p.name === newAppointment.procedure);
        if (selectedProc) setNewAppointment(prev => ({ 
            ...prev, 
            price: selectedProc.defaultPrice, 
            cost: selectedProc.defaultCost,
            duration: selectedProc.defaultDuration
        }));
    }, [newAppointment.procedure, procedures]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        const keys = name.split('.'); // For nested objects like anamnesis.healthHistory.hypertension
        
        setEditedClient(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
            return newState;
        });
    };

    const handleAddAppointment = () => {
        if (!newAppointment.date || !newAppointment.procedure) return toast.error("Data e procedimento são obrigatórios.");
        const appointmentToAdd: Appointment = { id: `appt-${Date.now()}`, ...newAppointment };
        const updatedClient = { ...editedClient, appointments: [...editedClient.appointments, appointmentToAdd] };
        setEditedClient(updatedClient);
        setClients(prevClients => prevClients.map(c => c.id === client.id ? updatedClient : c));
        setNewAppointment({ ...emptyAppointment, date: newAppointment.date });
        toast.success(`Agendamento adicionado!`);
    }

    const clientKPIs = useMemo(() => {
        const totalSpent = editedClient.appointments.reduce((sum, appt) => sum + appt.price, 0);
        const totalVisits = editedClient.appointments.length;
        const ticketMedium = totalVisits > 0 ? totalSpent / totalVisits : 0;
        return { totalSpent, totalVisits, ticketMedium };
    }, [editedClient.appointments]);
    
    const AnamnesisCheckbox = ({ name, label }: {name: string, label: string}) => {
        const keys = name.split('.');
        let value = editedClient.anamnesis as any;
        keys.forEach(key => { value = value?.[key]; });
        return (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} checked={!!value} onChange={handleFieldChange} className="form-checkbox h-4 w-4 text-brand-purple-500 rounded" />{label}</label>
        );
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Detalhes do Cliente" maxWidth="max-w-4xl">
            <div className="text-gray-700 dark:text-gray-300">
                {/* Header with KPIs */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><p className="text-xs uppercase font-semibold opacity-70">Total Gasto</p><p className="text-xl font-bold">{clientKPIs.totalSpent.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><p className="text-xs uppercase font-semibold opacity-70">Total de Visitas</p><p className="text-xl font-bold">{clientKPIs.totalVisits}</p></div>
                    <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg"><p className="text-xs uppercase font-semibold opacity-70">Ticket Médio</p><p className="text-xl font-bold">{clientKPIs.ticketMedium.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p></div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-2 font-semibold ${activeTab === 'info' ? 'border-b-2 border-brand-pink-500 text-brand-pink-500' : 'text-gray-500'}`}>Informações</button>
                    <button onClick={() => setActiveTab('anamnesis')} className={`px-4 py-2 font-semibold ${activeTab === 'anamnesis' ? 'border-b-2 border-brand-pink-500 text-brand-pink-500' : 'text-gray-500'}`}>Anamnese</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-semibold ${activeTab === 'history' ? 'border-b-2 border-brand-pink-500 text-brand-pink-500' : 'text-gray-500'}`}>Histórico</button>
                </div>

                {/* Tab Content */}
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {activeTab === 'info' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" value={editedClient.name} onChange={handleFieldChange} placeholder="Nome Completo" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"/>
                        <input type="text" name="phone" value={editedClient.phone} onChange={handleFieldChange} placeholder="Telefone" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"/>
                        <input type="email" name="email" value={editedClient.email} onChange={handleFieldChange} placeholder="E-mail" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"/>
                        <input type="date" name="birthDate" value={editedClient.birthDate || ''} onChange={handleFieldChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"/>
                        <input type="text" name="cpf" value={editedClient.cpf || ''} onChange={handleFieldChange} placeholder="CPF" className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"/>
                        <select name="gender" value={editedClient.gender || ''} onChange={handleFieldChange} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"><option>Prefiro não dizer</option><option>Feminino</option><option>Masculino</option><option>Não Binário</option></select>
                    </div>}
                    
                    {activeTab === 'anamnesis' && <div className="space-y-6">
                        <fieldset className="p-4 border rounded-lg"><legend className="px-2 font-bold">Histórico de Saúde</legend><div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <AnamnesisCheckbox name="anamnesis.healthHistory.hypertension" label="Hipertensão" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.diabetes" label="Diabetes" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.hormonalDisorders" label="Dist. Hormonais" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.epilepsy" label="Epilepsia" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.heartDisease" label="Doença Cardíaca" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.autoimmuneDisease" label="Doença Autoimune" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.respiratoryProblems" label="Probl. Respiratórios" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.cancer" label="Câncer" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.pacemaker" label="Marcapasso" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.skinDisease" label="Doença de Pele" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.keloids" label="Queloides" />
                            <AnamnesisCheckbox name="anamnesis.healthHistory.hepatitis" label="Hepatite" />
                        </div><textarea name="anamnesis.healthHistory.otherConditions" value={editedClient.anamnesis.healthHistory.otherConditions} onChange={handleFieldChange} placeholder="Outras condições..." rows={2} className="mt-3 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"></textarea></fieldset>
                        
                        <fieldset className="p-4 border rounded-lg"><legend className="px-2 font-bold">Medicações</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <AnamnesisCheckbox name="anamnesis.medications.roaccutane" label="Usa/usou Roacutan?" />
                           <AnamnesisCheckbox name="anamnesis.medications.contraceptive" label="Usa anticoncepcional?" />
                           <textarea name="anamnesis.medications.currentMedications" value={editedClient.anamnesis.medications.currentMedications} onChange={handleFieldChange} placeholder="Medicações em uso..." rows={2} className="col-span-full mt-3 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"></textarea>
                        </div></fieldset>

                        <fieldset className="p-4 border rounded-lg"><legend className="px-2 font-bold">Alergias</legend><div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                             <AnamnesisCheckbox name="anamnesis.allergies.alcohol" label="Álcool" /><AnamnesisCheckbox name="anamnesis.allergies.latex" label="Látex" /><AnamnesisCheckbox name="anamnesis.allergies.cosmetics" label="Cosméticos" /><AnamnesisCheckbox name="anamnesis.allergies.localAnesthetics" label="Anestésicos" /><AnamnesisCheckbox name="anamnesis.allergies.lashGlue" label="Cola de Cílios" /><AnamnesisCheckbox name="anamnesis.allergies.henna" label="Henna" />
                        </div><textarea name="anamnesis.allergies.otherAllergies" value={editedClient.anamnesis.allergies.otherAllergies} onChange={handleFieldChange} placeholder="Outras alergias..." rows={2} className="mt-3 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"></textarea></fieldset>

                        <fieldset className="p-4 border rounded-lg"><legend className="px-2 font-bold">Autorizações</legend><div className="flex flex-col gap-3">
                           <AnamnesisCheckbox name="anamnesis.imageAuth" label="Autorizo o uso de imagem (antes/depois) para portfólio." />
                           <AnamnesisCheckbox name="anamnesis.declaration" label="Declaro que as informações são verdadeiras." />
                        </div><textarea name="anamnesis.professionalNotes" value={editedClient.anamnesis.professionalNotes} onChange={handleFieldChange} placeholder="Notas da profissional..." rows={3} className="mt-3 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"></textarea></fieldset>
                    </div>}

                    {activeTab === 'history' && <div className="space-y-4">
                       <div className="space-y-2 max-h-40 overflow-y-auto pr-2">{editedClient.appointments.length > 0 ? [...editedClient.appointments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (
                            <div key={appt.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm"><p><strong>{appt.procedure}</strong></p><p>{new Date(appt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })} | {appt.duration} min | <strong>{appt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> ({appt.status})</p></div>
                        )) : <p className="text-sm italic">Nenhum agendamento.</p>}</div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"><h4 className="font-bold mb-3 text-lg">Adicionar Agendamento</h4><div className="grid grid-cols-2 gap-3">
                            <input type="date" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                            <input type="time" value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                            <select value={newAppointment.procedure} onChange={e => setNewAppointment({...newAppointment, procedure: e.target.value})} className="col-span-2 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"><option value="">Selecione um Procedimento</option>{procedures.map(proc => <option key={proc.id} value={proc.name}>{proc.name}</option>)}</select>
                            <input type="number" placeholder="Preço" value={newAppointment.price || ''} onChange={e => setNewAppointment({...newAppointment, price: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                            <input type="number" placeholder="Duração (min)" value={newAppointment.duration || ''} onChange={e => setNewAppointment({...newAppointment, duration: parseInt(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                            <select value={newAppointment.status} onChange={e => setNewAppointment({...newAppointment, status: e.target.value as Appointment['status']})} className="col-span-2 w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"><option value="Pendente">Pendente</option><option value="Pago">Pago</option><option value="Atrasado">Atrasado</option></select>
                            <button onClick={handleAddAppointment} className="col-span-2 w-full bg-brand-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-purple-700">Adicionar</button>
                        </div></div>
                    </div>}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={() => { onSave(editedClient); onClose(); }} className="bg-brand-pink-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-brand-pink-700">Salvar Alterações</button>
                </div>
            </div>
        </Modal>
    );
}