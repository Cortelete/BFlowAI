
import React, { useState, useMemo, useEffect, useCallback, ChangeEvent } from 'react';
import type { Client, Appointment, Procedure, User, AnamnesisRecord, MaterialUsed, ProcedureImage, ProcedureStep } from '../types';
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
const emptyClient: Omit<Client, 'id' | 'appointments'> = { name: '', phone: '', email: '', birthDate: '', gender: 'Prefiro não dizer', cpf: '', photo: '', profession: '', howTheyMetUs: '', aestheticGoals: '', usualProcedures: '', careFrequency: '', areasOfInterest: [], internalNotes: '', anamnesis: emptyAnamnesisRecord };
type ClientStatus = 'Todos' | 'Ativos' | 'Inativos' | 'Aniversariantes';

// Reusable form components
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
const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <select {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500 appearance-none">
            {children}
        </select>
    </div>
);
const CheckboxField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" {...props} className="h-4 w-4 rounded text-brand-pink-500 focus:ring-brand-pink-500 border-gray-300" />
        {label}
    </label>
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

  // Handler for deep nested state changes, e.g., in anamnesis
    const handleDeepChange = (path: string, value: any) => {
        setNewClient(prev => {
            const keys = path.split('.');
            let current: any = { ...prev };
            let obj = current;

            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] };
                obj = obj[keys[i]];
            }

            obj[keys[keys.length - 1]] = value;
            return current;
        });
    };

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
                    {filteredClients.length > 0 ? filteredClients.map(client => {
                        const status = getClientStatus(client);
                        const lastVisit = client.appointments.length > 0 ? new Date([...client.appointments].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';
                        return (
                            <tr key={client.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                                <td className="py-2 px-6"><div className="flex items-center gap-3"><div className="flex-shrink-0">{getAvatar(client)}</div><span>{client.name}</span></div></td>
                                <td className="py-4 px-6">{client.phone}</td>
                                <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}>{status.text}</span></td>
                                <td className="py-4 px-6">{lastVisit}</td>
                                <td className="py-4 px-6"><div className='flex gap-2 justify-start'>
                                    <button onClick={() => handleViewDetails(client)} className="bg-brand-purple-500 text-white p-2 rounded-lg shadow hover:bg-brand-purple-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="bg-red-500 text-white p-2 rounded-lg shadow hover:bg-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                </div></td>
                            </tr>
                        )
                    }) : (
                         <tr><td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">Nenhum cliente encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

       {/* Add Client Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Nova Cliente" maxWidth="max-w-3xl">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-2">
            <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">1. Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Nome Completo *" name="name" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} />
                <InputField label="Data de Nascimento" type="date" name="birthDate" value={newClient.birthDate || ''} onChange={(e) => setNewClient({...newClient, birthDate: e.target.value})} />
                <SelectField label="Gênero" name="gender" value={newClient.gender} onChange={(e) => setNewClient({...newClient, gender: e.target.value as any})}>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Não Binário">Não Binário</option>
                </SelectField>
                <InputField label="Profissão" name="profession" value={newClient.profession || ''} onChange={(e) => setNewClient({...newClient, profession: e.target.value})} />
                <InputField label="CPF" name="cpf" value={newClient.cpf || ''} onChange={(e) => setNewClient({...newClient, cpf: e.target.value})} />
                <SelectField label="Como Conheceu o Studio?" name="howTheyMetUs" value={newClient.howTheyMetUs} onChange={(e) => setNewClient({...newClient, howTheyMetUs: e.target.value})}>
                     <option value="">Selecione uma opção</option>
                     <option value="Indicação">Indicação</option>
                     <option value="Instagram">Instagram</option>
                     <option value="Facebook">Facebook</option>
                     <option value="Google">Google</option>
                     <option value="Passou em frente">Passou em frente</option>
                     <option value="Outro">Outro</option>
                </SelectField>
            </div>

            <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">2. Contato</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Telefone com WhatsApp *" type="tel" name="phone" value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
                <InputField label="E-mail" type="email" name="email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
            </div>

            <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">3. Anamnese Essencial</h3>
             <div className="space-y-2">
                <TextAreaField label="Possui alergia a algum produto? Se sim, qual?" name="otherAllergies" value={newClient.anamnesis.allergies.otherAllergies} onChange={(e) => handleDeepChange('anamnesis.allergies.otherAllergies', e.target.value)} />
                <TextAreaField label="Utiliza medicamentos contínuos? Se sim, quais?" name="currentMedications" value={newClient.anamnesis.medications.currentMedications} onChange={(e) => handleDeepChange('anamnesis.medications.currentMedications', e.target.value)} />
                <CheckboxField label="Está gestante ou amamentando?" name="otherConditions" checked={newClient.anamnesis.healthHistory.otherConditions.includes('Gestante')} onChange={(e) => handleDeepChange('anamnesis.healthHistory.otherConditions', e.target.checked ? 'Gestante/Lactante' : '')} />
            </div>

            <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">4. Termos e Observações</h3>
             <div className="space-y-2">
                 <CheckboxField label="Cliente aceita os termos de uso e política de privacidade." name="declaration" checked={newClient.anamnesis.declaration} onChange={(e) => handleDeepChange('anamnesis.declaration', e.target.checked)} />
                 <CheckboxField label="Cliente autoriza o uso de imagem para divulgação." name="imageAuth" checked={newClient.anamnesis.imageAuth} onChange={(e) => handleDeepChange('anamnesis.imageAuth', e.target.checked)} />
                <TextAreaField label="Observações Internas (visível apenas para a profissional)" name="internalNotes" value={newClient.internalNotes || ''} onChange={(e) => setNewClient({...newClient, internalNotes: e.target.value})} />
            </div>

            <button onClick={handleAddClient} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors mt-6">
              Salvar Cliente
            </button>
        </div>
      </Modal>

      {selectedClient && <ClientDetailsModal key={selectedClient.id} client={selectedClient} procedures={procedures} isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} onSave={handleSaveClientDetails} onDelete={handleDeleteClient} currentUser={currentUser} />}
    </div>
  );
};


// --- DETAILS MODAL & SUB-COMPONENTS ---

interface ClientDetailsModalProps {
    client: Client;
    procedures: Procedure[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client) => void;
    onDelete: (clientId: string) => void;
    currentUser: User;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, procedures, isOpen, onClose, onSave, onDelete, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'anamnesis' | 'history'>('info');
    const [editableClient, setEditableClient] = useState<Client>(client);

    // Sync state if the client prop changes from the outside
    useEffect(() => {
        setEditableClient(client);
    }, [client]);

    const handleClientChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditableClient(prev => ({...prev, [name]: value}));
    };
    
    const handleAnamnesisChange = (path: string, value: any) => {
        setEditableClient(prev => {
            const keys = path.split('.');
            let current = { ...prev };
            // Ensure anamnesis object exists
            if (!current.anamnesis) current.anamnesis = { ...emptyAnamnesisRecord };
            let obj: any = current.anamnesis;

            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] };
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
            return current;
        });
    };
    
    const handleSaveAndClose = () => {
        onSave(editableClient);
        onClose();
    };

    const totalSpent = useMemo(() => editableClient.appointments.reduce((acc, appt) => acc + appt.finalValue, 0), [editableClient.appointments]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${client.name}`} maxWidth="max-w-6xl">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Panel */}
                <div className="w-full md:w-1/4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                    <img src={editableClient.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=8E44AD&color=fff&size=128`} alt={client.name} className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg mb-4" />
                    <h3 className="text-xl font-bold text-center">{editableClient.name}</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{editableClient.email}</p>
                    <div className="text-center space-y-2 text-sm my-4">
                        <p><strong>Total Gasto:</strong> {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p><strong>Total de Visitas:</strong> {editableClient.appointments.length}</p>
                    </div>
                    <div className="space-y-2">
                        <button onClick={() => setActiveTab('info')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'info' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Informações</button>
                        <button onClick={() => setActiveTab('anamnesis')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'anamnesis' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Anamnese</button>
                        <button onClick={() => setActiveTab('history')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'history' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Histórico</button>
                    </div>
                     <button onClick={handleSaveAndClose} className="w-full mt-6 bg-brand-pink-500 text-white font-bold py-2 rounded-lg hover:bg-brand-pink-700 transition-colors">Salvar Alterações</button>
                </div>
                {/* Right Panel */}
                <div className="w-full md:w-3/4 max-h-[75vh] overflow-y-auto pr-2">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Informações Pessoais</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField label="Nome Completo" name="name" value={editableClient.name} onChange={handleClientChange} />
                                <InputField label="Telefone" name="phone" value={editableClient.phone} onChange={handleClientChange} />
                                <InputField label="E-mail" name="email" value={editableClient.email} onChange={handleClientChange} />
                                <InputField label="Data de Nascimento" type="date" name="birthDate" value={editableClient.birthDate || ''} onChange={handleClientChange} />
                                <InputField label="Profissão" name="profession" value={editableClient.profession || ''} onChange={handleClientChange} />
                                <InputField label="CPF" name="cpf" value={editableClient.cpf || ''} onChange={handleClientChange} />
                            </div>
                            <TextAreaField label="Observações Internas" name="internalNotes" value={editableClient.internalNotes || ''} onChange={handleClientChange} />
                        </div>
                    )}
                    {activeTab === 'anamnesis' && <AnamnesisForm anamnesis={editableClient.anamnesis} onChange={handleAnamnesisChange} />}
                    {activeTab === 'history' && <HistoryTab client={editableClient} setClient={setEditableClient} procedures={procedures} currentUser={currentUser} />}
                </div>
            </div>
        </Modal>
    );
};


const AnamnesisForm: React.FC<{ anamnesis: AnamnesisRecord, onChange: (path: string, value: any) => void }> = ({ anamnesis, onChange }) => {
    const handleCheckboxChange = (path: string) => (e: ChangeEvent<HTMLInputElement>) => onChange(path, e.target.checked);
    const handleValueChange = (path: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(path, e.target.value);
    
    return (
        <div className="space-y-6">
            <h3 className="font-bold text-xl border-b pb-2">Ficha de Anamnese Completa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* Histórico de Saúde */}
                <fieldset className="space-y-2">
                    <legend className="font-semibold text-lg mb-2">Histórico de Saúde</legend>
                    {Object.entries(anamnesis.healthHistory).filter(([key]) => key !== 'otherConditions').map(([key, value]) => (
                        <CheckboxField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} checked={value} onChange={handleCheckboxChange(`healthHistory.${key}`)} />
                    ))}
                    <TextAreaField label="Outras Condições" value={anamnesis.healthHistory.otherConditions} onChange={handleValueChange('healthHistory.otherConditions')} />
                </fieldset>
                
                 {/* Alergias */}
                <fieldset className="space-y-2">
                    <legend className="font-semibold text-lg mb-2">Alergias</legend>
                     {Object.entries(anamnesis.allergies).filter(([key]) => key !== 'otherAllergies').map(([key, value]) => (
                        <CheckboxField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} checked={value} onChange={handleCheckboxChange(`allergies.${key}`)} />
                    ))}
                    <TextAreaField label="Outras Alergias" value={anamnesis.allergies.otherAllergies} onChange={handleValueChange('allergies.otherAllergies')} />
                </fieldset>

                {/* Medicações e Tratamentos */}
                <fieldset className="col-span-1 md:col-span-2 space-y-2">
                    <legend className="font-semibold text-lg mb-2">Medicações e Tratamentos</legend>
                    <TextAreaField label="Medicações em uso" value={anamnesis.medications.currentMedications} onChange={handleValueChange('medications.currentMedications')} />
                    <div className="flex gap-6">
                         <CheckboxField label="Usa/usou Roacutan nos últimos 12 meses?" checked={anamnesis.medications.roaccutane} onChange={handleCheckboxChange('medications.roaccutane')} />
                         <CheckboxField label="Usa anticoncepcional?" checked={anamnesis.medications.contraceptive} onChange={handleCheckboxChange('medications.contraceptive')} />
                    </div>
                </fieldset>
                
                {/* Histórico Estético */}
                <fieldset className="col-span-1 md:col-span-2 space-y-4">
                    <legend className="font-semibold text-lg mb-2">Histórico Estético</legend>
                     {/* Lash */}
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">Extensão de Cílios</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <CheckboxField label="Já fez extensão antes?" checked={anamnesis.aestheticHistory.lashExtensions.hasDoneBefore} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.hasDoneBefore')} />
                            <CheckboxField label="Teve reação?" checked={anamnesis.aestheticHistory.lashExtensions.hadReaction} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.hadReaction')} />
                            <TextAreaField label="Descrição da reação" value={anamnesis.aestheticHistory.lashExtensions.reactionDescription} onChange={handleValueChange('aestheticHistory.lashExtensions.reactionDescription')} className="col-span-2"/>
                             <CheckboxField label="Usa lentes de contato?" checked={anamnesis.aestheticHistory.lashExtensions.wearsContacts} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.wearsContacts')} />
                            <CheckboxField label="Usa colírios?" checked={anamnesis.aestheticHistory.lashExtensions.usesEyeDrops} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.usesEyeDrops')} />
                        </div>
                    </div>
                     {/* Skin */}
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">Cuidados com a Pele</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <SelectField label="Tipo de pele" value={anamnesis.aestheticHistory.skinCare.skinType} onChange={handleValueChange('aestheticHistory.skinCare.skinType')}>
                                <option value="">Não informado</option>
                                <option>Oleosa</option><option>Seca</option><option>Mista</option><option>Sensível</option><option>Acneica</option>
                            </SelectField>
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                               <CheckboxField label="Usa ácidos/peelings?" checked={anamnesis.aestheticHistory.skinCare.usesAcids} onChange={handleCheckboxChange('aestheticHistory.skinCare.usesAcids')} />
                               <CheckboxField label="Já fez microagulhamento?" checked={anamnesis.aestheticHistory.skinCare.hadNeedling} onChange={handleCheckboxChange('aestheticHistory.skinCare.hadNeedling')} />
                               <CheckboxField label="Fez procedimentos recentes?" checked={anamnesis.aestheticHistory.skinCare.recentProcedures} onChange={handleCheckboxChange('aestheticHistory.skinCare.recentProcedures')} />
                            </div>
                        </div>
                    </div>
                </fieldset>

                 {/* Rotina e Termos */}
                 <fieldset className="col-span-1 md:col-span-2 space-y-2">
                    <legend className="font-semibold text-lg mb-2">Rotina e Consentimento</legend>
                    <CheckboxField label="Usa protetor solar diariamente?" checked={anamnesis.careRoutine.usesSunscreen} onChange={handleCheckboxChange('careRoutine.usesSunscreen')} />
                    <TextAreaField label="Produtos em uso" value={anamnesis.careRoutine.currentProducts} onChange={handleValueChange('careRoutine.currentProducts')} />
                    <TextAreaField label="Anotações da Profissional" value={anamnesis.professionalNotes} onChange={handleValueChange('professionalNotes')} />
                     <CheckboxField label="Declaro que as informações são verdadeiras" checked={anamnesis.declaration} onChange={handleCheckboxChange('declaration')} />
                    <CheckboxField label="Autorizo uso de imagem" checked={anamnesis.imageAuth} onChange={handleCheckboxChange('imageAuth')} />
                </fieldset>
            </div>
        </div>
    )
}


const HistoryTab: React.FC<{client: Client, setClient: React.Dispatch<React.SetStateAction<Client>>, procedures: Procedure[], currentUser: User}> = ({client, setClient, procedures, currentUser}) => {
    const [isApptModalOpen, setApptModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

    const handleOpenNewAppointment = () => {
        setSelectedAppt(createEmptyAppointment());
        setApptModalOpen(true);
    };

    const handleOpenEditAppointment = (appt: Appointment) => {
        setSelectedAppt(appt);
        setApptModalOpen(true);
    };
    
    const handleSaveAppointment = (updatedAppt: Appointment) => {
        setClient(prev => {
            const existing = prev.appointments.find(a => a.id === updatedAppt.id);
            if (existing) {
                return {...prev, appointments: prev.appointments.map(a => a.id === updatedAppt.id ? updatedAppt : a)}
            }
            return {...prev, appointments: [...prev.appointments, updatedAppt]};
        });
        setApptModalOpen(false);
        setSelectedAppt(null);
    }
    
    const handleDeleteAppointment = (apptId: string) => {
        if(window.confirm("Tem certeza que deseja excluir este registro de atendimento?")) {
            setClient(prev => ({...prev, appointments: prev.appointments.filter(a => a.id !== apptId)}));
            toast.success("Atendimento excluído.");
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">Histórico de Atendimentos</h3>
                <button onClick={handleOpenNewAppointment} className="bg-brand-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-purple-700 transition-all flex items-center gap-2 text-sm">
                    <Icon icon="plus" className="w-4 h-4"/> Registrar Atendimento
                </button>
            </div>
             <div className="space-y-3">
                {[...client.appointments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (
                     <div key={appt.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center text-sm transition-all hover:shadow-md">
                        <div>
                            <p className="font-bold">{appt.procedureName}</p>
                            <p className="text-xs opacity-70">{new Date(appt.date).toLocaleDateString('pt-BR', {timeZone:'UTC'})} - {appt.finalValue.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appt.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{appt.status}</span>
                             <button onClick={() => handleOpenEditAppointment(appt)} className="text-blue-500 hover:underline">Ver/Editar</button>
                             <button onClick={() => handleDeleteAppointment(appt.id)} className="text-red-500 hover:underline">Excluir</button>
                        </div>
                     </div>
                ))}
                {client.appointments.length === 0 && <p className="text-sm italic text-center py-4">Nenhum atendimento registrado.</p>}
            </div>
             {isApptModalOpen && selectedAppt && <AppointmentRecordModal isOpen={isApptModalOpen} onClose={() => setApptModalOpen(false)} appointment={selectedAppt} onSave={handleSaveAppointment} procedures={procedures} currentUser={currentUser} />}
        </div>
    )
}

const AppointmentRecordModal: React.FC<{ isOpen: boolean, onClose: () => void, appointment: Appointment, onSave: (appt: Appointment) => void, procedures: Procedure[], currentUser: User}> = ({isOpen, onClose, appointment, onSave, procedures, currentUser}) => {
    const [record, setRecord] = useState<Appointment>(appointment);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        // Auto-calculate final value when value or discount changes
        const final = (record.value || 0) - (record.discount || 0);
        const profit = final - (record.cost || 0);
        setRecord(prev => ({...prev, finalValue: final, profit: profit}));
    }, [record.value, record.discount, record.cost])

    // Auto-fill details from procedure template
    useEffect(() => {
        const selectedProc = procedures.find(p => p.name === record.procedureName);
        if(selectedProc) {
            setRecord(prev => ({
                ...prev,
                category: selectedProc.category,
                value: selectedProc.defaultPrice,
                cost: selectedProc.defaultCost,
                duration: selectedProc.defaultDuration,
                postProcedureInstructions: selectedProc.defaultPostProcedureInstructions,
                procedureSteps: [
                    {id: 'step1', name: 'Higienização', done: false},
                    {id: 'step2', name: 'Aplicação', done: false},
                    {id: 'step3', name: 'Finalização', done: false},
                ]
            }));
        }
    }, [record.procedureName, procedures]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const val = type === 'number' ? parseFloat(value) || 0 : value;
        setRecord(prev => ({...prev, [name]: val}));
    };
    
    const handleMaterialChange = (index: number, field: keyof MaterialUsed, value: any) => {
        const newMaterials = [...record.materials];
        newMaterials[index] = {...newMaterials[index], [field]: value};
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setRecord(prev => ({...prev, materials: newMaterials, cost: totalCost}));
    }
    
    const addMaterial = () => {
        setRecord(prev => ({...prev, materials: [...prev.materials, {id: `mat-${Date.now()}`, name: '', quantity: '1', unit: 'un', cost: 0}]}));
    }

    const removeMaterial = (index: number) => {
        const newMaterials = record.materials.filter((_, i) => i !== index);
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setRecord(prev => ({...prev, materials: newMaterials, cost: totalCost}));
    }

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: ProcedureImage['type']) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage: ProcedureImage = { id: `img-${Date.now()}`, url: event.target?.result as string, type, caption: '' };
                setRecord(prev => ({...prev, media: [...prev.media, newImage]}));
            }
            reader.readAsDataURL(file);
        }
    }

    const removeImage = (id: string) => {
        setRecord(prev => ({...prev, media: prev.media.filter(img => img.id !== id)}));
    }

     const handleStepToggle = (stepId: string) => {
        setRecord(prev => ({...prev, procedureSteps: prev.procedureSteps.map(s => s.id === stepId ? {...s, done: !s.done} : s)}));
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={record.id.startsWith('appt-') ? "Registrar Novo Atendimento" : "Editar Atendimento"} maxWidth="max-w-4xl">
             <div className="flex gap-4">
                <div className="w-1/4 space-y-2">
                    <button onClick={() => setActiveTab('general')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'general' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Geral</button>
                    <button onClick={() => setActiveTab('technical')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'technical' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Técnico</button>
                    <button onClick={() => setActiveTab('financial')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'financial' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Financeiro</button>
                    <button onClick={() => setActiveTab('media')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'media' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Mídia</button>
                    <button onClick={() => setActiveTab('post')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'post' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Pós-Procedimento</button>
                </div>
                <div className="w-3/4 max-h-[70vh] overflow-y-auto pr-2 space-y-4">
                    {activeTab === 'general' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">Dados Gerais</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SelectField label="Procedimento" name="procedureName" value={record.procedureName} onChange={handleChange}>
                                    <option value="">Selecione...</option>
                                    {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </SelectField>
                                <InputField label="Categoria" name="category" value={record.category} onChange={handleChange} disabled/>
                                <InputField label="Data" type="date" name="date" value={record.date} onChange={handleChange}/>
                                <InputField label="Profissional" name="professional" value={record.professional || currentUser.fullName || ''} onChange={handleChange}/>
                                <InputField label="Duração (min)" type="number" name="duration" value={record.duration} onChange={handleChange}/>
                                <TextAreaField label="Observações Gerais" name="generalNotes" value={record.generalNotes} onChange={handleChange}/>
                             </div>
                        </div>
                    )}
                     {activeTab === 'technical' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">Materiais, Equipamentos e Etapas</h4>
                            <InputField label="Equipamentos Utilizados" name="equipmentUsed" placeholder="Ex: Radiofrequência Spectra G3, Dermógrafo..." value={record.equipmentUsed} onChange={handleChange}/>
                            <div className="my-4">
                                <h5 className="font-semibold mb-2">Etapas Executadas</h5>
                                <div className="space-y-1">
                                    {record.procedureSteps.map(step => <CheckboxField key={step.id} label={step.name} checked={step.done} onChange={() => handleStepToggle(step.id)} />)}
                                </div>
                            </div>
                            <div>
                                <h5 className="font-semibold mb-2">Materiais Utilizados (Custo Total: {record.cost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</h5>
                                {record.materials.map((mat, index) => (
                                    <div key={mat.id} className="grid grid-cols-5 gap-2 mb-2 items-center">
                                        <input type="text" placeholder="Nome" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <input type="text" placeholder="Qtd" value={mat.quantity} onChange={e => handleMaterialChange(index, 'quantity', e.target.value)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <input type="number" placeholder="Custo" value={mat.cost || ''} onChange={e => handleMaterialChange(index, 'cost', parseFloat(e.target.value) || 0)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <button onClick={() => removeMaterial(index)} className="text-red-500">×</button>
                                    </div>
                                ))}
                                <button onClick={addMaterial} className="text-sm text-blue-500 font-semibold">+ Adicionar Material</button>
                            </div>
                            <TextAreaField label="Observações Técnicas" name="technicalNotes" value={record.technicalNotes} onChange={handleChange} className="mt-4"/>
                        </div>
                    )}
                    {activeTab === 'financial' && (
                        <div>
                             <h4 className="font-bold text-lg mb-2">Financeiro</h4>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <InputField label="Valor (R$)" type="number" name="value" value={record.value} onChange={handleChange}/>
                                <InputField label="Desconto (R$)" type="number"name="discount" value={record.discount} onChange={handleChange}/>
                                <InputField label="Valor Final (R$)" type="number" value={record.finalValue} disabled className="!bg-gray-200 dark:!bg-gray-800"/>
                                <InputField label="Custo (R$)" type="number" value={record.cost} disabled className="!bg-gray-200 dark:!bg-gray-800"/>
                             </div>
                             <div className="grid grid-cols-2 gap-4 mt-4">
                                <SelectField label="Forma de Pagamento" name="paymentMethod" value={record.paymentMethod} onChange={handleChange}>
                                    <option value="">Selecione...</option>
                                    <option>Dinheiro</option><option>Pix</option><option>Cartão Crédito/Débito</option><option>Transferência</option><option>Cortesia</option>
                                </SelectField>
                                <SelectField label="Status do Pagamento" name="status" value={record.status} onChange={handleChange}>
                                    <option>Pendente</option><option>Pago</option><option>Atrasado</option>
                                </SelectField>
                             </div>
                             <div className="grid grid-cols-2 gap-4 mt-4">
                                <InputField label="Comissão (%)" type="number" name="commission" value={record.commission} onChange={handleChange}/>
                                 <div>
                                     <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">Satisfação da Cliente</label>
                                     <div className="flex">
                                        {[1,2,3,4,5].map(star => <button key={star} onClick={() => setRecord({...record, clientSatisfaction: star})} className={`text-2xl ${star <= record.clientSatisfaction ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>)}
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                     {activeTab === 'media' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">Mídia do Atendimento</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Antes</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Antes')} className="text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Depois</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Depois')} className="text-sm"/>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {record.media.map(img => (
                                    <div key={img.id} className="relative group">
                                        <img src={img.url} alt={img.type} className="w-full h-auto rounded-lg object-cover"/>
                                        <p className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1 py-0.5 rounded-br-lg rounded-tl-lg">{img.type}</p>
                                        <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                     {activeTab === 'post' && (
                        <div>
                             <h4 className="font-bold text-lg mb-2">Pós-Procedimento</h4>
                             <TextAreaField label="Instruções para a Cliente" name="postProcedureInstructions" value={record.postProcedureInstructions} onChange={handleChange} rows={5}/>
                             <div className="mt-4 flex gap-4 items-center">
                                 <CheckboxField label="Necessita Retorno?" checked={record.requiresReturn} onChange={e => setRecord({...record, requiresReturn: e.target.checked})}/>
                                 {record.requiresReturn && <InputField label="Data do Retorno" type="date" name="returnDate" value={record.returnDate || ''} onChange={handleChange}/>}
                             </div>
                        </div>
                    )}
                </div>
            </div>
             <button onClick={() => onSave(record)} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors mt-6">
              Salvar Registro
            </button>
        </Modal>
    )
}
