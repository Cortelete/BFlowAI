import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Procedure, User, AnamnesisRecord } from '../types';
import { importFromExcel } from '../services/clientService';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { Icon } from '../components/common/Icon';
import ClientDetailsModal from '../components/clients/ClientDetailsModal';
import AnamnesisForm from '../components/clients/AnamnesisForm';
import InputField from '../components/common/InputField';
import TextAreaField from '../components/common/TextAreaField';
import SelectField from '../components/common/SelectField';
import { getAvatarColor } from '../utils/helpers';

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

const emptyClient: Omit<Client, 'id' | 'appointments'> = { 
    name: '', phone: '', email: '', birthDate: '', gender: 'Prefiro não dizer', cpf: '', 
    photo: '', profession: '', howTheyMetUs: '', tags: [], aestheticGoals: '', 
    usualProcedures: '', careFrequency: '', areasOfInterest: [], internalNotes: '', 
    anamnesis: emptyAnamnesisRecord 
};

type ClientStatus = 'Todos' | 'Ativos' | 'Inativos' | 'Aniversariantes';

const Tag: React.FC<{ text: string }> = ({ text }) => {
    const color = getAvatarColor(text);
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${color}`}>
            {text}
        </span>
    );
}

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
    if (client.appointments.length === 0) return { text: 'Novo', color: 'bg-blue-500' };
    const lastApptDate = new Date([...client.appointments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date);
    const diffDays = (new Date().getTime() - lastApptDate.getTime()) / (1000 * 3600 * 24);

    if (diffDays <= 30) return { text: 'Recente', color: 'bg-green-500' };
    if (diffDays <= 90) return { text: 'Ativo', color: 'bg-yellow-500' };
    return { text: 'Inativo', color: 'bg-red-500' };
  }, []);

  const filteredClients = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();

    return clients.filter(client => {
        const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!searchMatch) return false;

        switch (statusFilter) {
          case 'Aniversariantes':
            if (!client.birthDate) return false;
            const birthDate = new Date(client.birthDate);
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

  const clientOfTheMonth = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let topClient: Client | null = null;
    let maxSpent = 0;

    clients.forEach(client => {
        const spentThisMonth = client.appointments
            .filter(appt => {
                const apptDate = new Date(appt.date);
                return apptDate.getUTCMonth() === currentMonth && apptDate.getUTCFullYear() === currentYear && appt.status === 'Pago';
            })
            .reduce((sum, appt) => sum + (appt.finalValue || appt.price || 0), 0);
        if (spentThisMonth > maxSpent) {
            maxSpent = spentThisMonth;
            topClient = client;
        }
    });

    return topClient ? { ...topClient, spent: maxSpent } : null;
  }, [clients]);

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
      toast.success("Dados da cliente atualizados!");
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
      toast.success(`${newUniqueClients.length} novas clientes importadas!`, { id: toastId });
    } catch (error) {
      toast.error(String(error), { id: toastId });
    }
    event.target.value = '';
  };
  
  const getAvatar = (client: Client) => {
      if (client.photo) return <img src={client.photo} alt={client.name} className="w-10 h-10 rounded-full object-cover"/>;
      const initials = client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const colorClass = getAvatarColor(client.name);
      return (
          <div className={`w-10 h-10 rounded-full ${colorClass} text-white flex items-center justify-center font-bold text-sm`}>
              {initials}
          </div>
      );
  }

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
        
        {clientOfTheMonth && (
            <div className="mb-6 bg-gradient-to-r from-brand-gold-300 to-brand-pink-300 p-5 rounded-xl shadow-lg text-gray-800 flex items-center gap-4">
                <Icon icon="idea" className="w-12 h-12 text-white" />
                <div>
                    <h3 className="font-bold text-lg">Cliente do Mês! 🌟</h3>
                    <p>Parabéns para <strong>{clientOfTheMonth.name}</strong>, que investiu <strong className='font-serif'>{clientOfTheMonth.spent.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</strong> em sua beleza este mês!</p>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <input type="text" placeholder="Buscar por nome, contato ou tag..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all" />
          <div className="flex items-center gap-2 bg-white/20 dark:bg-black/30 p-1 rounded-full">
            {(['Todos', 'Ativos', 'Inativos', 'Aniversariantes'] as ClientStatus[]).map(p => (
              <button key={p} onClick={() => setStatusFilter(p)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${statusFilter === p ? 'bg-white dark:bg-gray-900 shadow text-brand-pink-500' : 'hover:bg-white/50 dark:hover:bg-black/50'}`}>{p}</button>
            ))}
          </div>
          <div className='flex gap-2'>
            <label htmlFor="excel-upload" className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105 cursor-pointer text-center">Importar</label>
            <input id="excel-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
            <button onClick={() => { setNewClient(emptyClient); setAddModalOpen(true); }} className="w-full md:w-auto bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105">Adicionar</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                <thead className="bg-white/30 dark:bg-gray-900/40">
                    <tr>{['Cliente', 'Contato', 'Tags', 'Status', 'Última Visita', 'Ações'].map(h => <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                    {filteredClients.length > 0 ? filteredClients.map(client => {
                        const status = getClientStatus(client);
                        const lastVisit = client.appointments.length > 0 ? new Date([...client.appointments].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime())[0].date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';
                        return (
                            <tr key={client.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                                <td className="py-2 px-6"><div className="flex items-center gap-3"><div className="flex-shrink-0">{getAvatar(client)}</div><span>{client.name}</span></div></td>
                                <td className="py-4 px-6">{client.phone}</td>
                                <td className="py-4 px-6"><div className="flex gap-1 flex-wrap">{client.tags?.map(tag => <Tag key={tag} text={tag} />)}</div></td>
                                <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${status.color}`}>{status.text}</span></td>
                                <td className="py-4 px-6">{lastVisit}</td>
                                <td className="py-4 px-6"><div className='flex gap-2 justify-start'>
                                    <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" title="Contatar no WhatsApp" className="bg-green-500 text-white p-2 rounded-lg shadow hover:bg-green-600 flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                                    </a>
                                    <button onClick={() => handleViewDetails(client)} className="bg-brand-purple-500 text-white p-2 rounded-lg shadow hover:bg-brand-purple-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                                    <button onClick={() => handleDeleteClient(client.id)} className="bg-red-500 text-white p-2 rounded-lg shadow hover:bg-red-700"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                                </div></td>
                            </tr>
                        )
                    }) : (
                         <tr><td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">Nenhuma cliente encontrada.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

       {/* Add Client Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Nova Cliente" maxWidth="max-w-4xl">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className='space-y-4'>
                    <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">1. Ficha Cadastral</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nome Completo *" name="name" value={newClient.name} onChange={(e) => setNewClient({...newClient, name: e.target.value})} />
                        <InputField label="Data de Nascimento" type="date" name="birthDate" value={newClient.birthDate || ''} onChange={(e) => setNewClient({...newClient, birthDate: e.target.value})} />
                         <InputField label="Telefone com WhatsApp *" type="tel" name="phone" value={newClient.phone} onChange={(e) => setNewClient({...newClient, phone: e.target.value})} />
                        <InputField label="E-mail" type="email" name="email" value={newClient.email} onChange={(e) => setNewClient({...newClient, email: e.target.value})} />
                        <SelectField label="Como Conheceu o Studio?" name="howTheyMetUs" value={newClient.howTheyMetUs} onChange={(e) => setNewClient({...newClient, howTheyMetUs: e.target.value})}>
                             <option value="">Selecione uma opção</option>
                             <option value="Indicação">Indicação</option>
                             <option value="Instagram">Instagram</option>
                             <option value="Facebook">Facebook</option>
                             <option value="Google">Google</option>
                             <option value="Passou em frente">Passou em frente</option>
                             <option value="Outro">Outro</option>
                        </SelectField>
                         <InputField label="Profissão" name="profession" value={newClient.profession || ''} onChange={(e) => setNewClient({...newClient, profession: e.target.value})} />
                         <InputField label="Tags (separadas por vírgula)" name="tags" value={(newClient.tags || []).join(', ')} onChange={(e) => setNewClient({...newClient, tags: e.target.value.split(',').map(t => t.trim())})} />
                    </div>
                     <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">2. Preferências e Objetivos</h3>
                     <div className="space-y-4">
                        <TextAreaField label="Objetivos com os procedimentos" name="aestheticGoals" value={newClient.aestheticGoals || ''} onChange={(e) => setNewClient({...newClient, aestheticGoals: e.target.value})} />
                        <TextAreaField label="Procedimentos que costuma realizar" name="usualProcedures" value={newClient.usualProcedures || ''} onChange={(e) => setNewClient({...newClient, usualProcedures: e.target.value})} />
                    </div>
                </div>
                <div className='space-y-4'>
                     <h3 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">3. Anamnese Completa</h3>
                     <AnamnesisForm anamnesis={newClient.anamnesis} onChange={handleDeepChange} />
                </div>
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