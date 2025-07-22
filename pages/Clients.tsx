import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Appointment, Procedure } from '../types';
import { importFromExcel } from '../services/clientService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

interface ClientsProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    procedures: Procedure[];
}

export const Clients: React.FC<ClientsProps> = ({ clients, setClients, procedures }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Omit<Client, 'id' | 'appointments'>>({ name: '', phone: '', email: '', anamnesis: '', birthDate: ''});
  const [newAppointment, setNewAppointment] = useState<Omit<Appointment, 'id'>>({ date: '', procedure: '', price: 0, cost: 0 });

  useEffect(() => {
      // When a procedure is selected from dropdown, auto-fill price and cost
      const selectedProc = procedures.find(p => p.name === newAppointment.procedure);
      if (selectedProc) {
          setNewAppointment(prev => ({...prev, price: selectedProc.defaultPrice, cost: selectedProc.defaultCost }));
      } else {
          // If a custom procedure is somehow entered, reset price/cost
          setNewAppointment(prev => ({...prev, price: 0, cost: 0 }));
      }
  }, [newAppointment.procedure, procedures]);

  const filteredClients = useMemo(() =>
    clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [clients, searchTerm]
  );

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setNewAppointment({ date: '', procedure: '', price: 0, cost: 0 }); // Reset form on open
    setDetailsModalOpen(true);
  };

  const handleAddClient = () => {
    if (!newClient.name || !newClient.phone) {
        toast.error('Nome e Telefone são obrigatórios.');
        return;
    }
    const clientToAdd: Client = {
        id: `client-${Date.now()}`,
        ...newClient,
        appointments: [],
    };
    setClients(prev => [clientToAdd, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    setNewClient({ name: '', phone: '', email: '', anamnesis: '', birthDate: ''});
    setAddModalOpen(false);
    toast.success(`${clientToAdd.name} foi adicionada com sucesso!`);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? Todos os seus dados e agendamentos serão perdidos permanentemente.")) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setDetailsModalOpen(false); // Close details modal if open
        toast.success("Cliente excluído com sucesso.");
    }
  };

  const handleAddAppointment = () => {
    if (!selectedClient || !newAppointment.date || !newAppointment.procedure) {
        toast.error("Data e procedimento são obrigatórios.");
        return;
    }
    const appointmentToAdd: Appointment = {
        id: `appt-${Date.now()}`,
        ...newAppointment
    };
    const updatedClients = clients.map(c => 
        c.id === selectedClient.id 
        ? { ...c, appointments: [...c.appointments, appointmentToAdd] } 
        : c
    );
    setClients(updatedClients);
    setSelectedClient(prev => prev ? { ...prev, appointments: [...prev.appointments, appointmentToAdd] } : null);
    setNewAppointment({ date: '', procedure: '', price: 0, cost: 0 });
    toast.success(`Agendamento para ${selectedClient.name} adicionado!`);
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Importando planilha...');
    try {
        const importedClients = await importFromExcel(file);
        const existingNames = new Set(clients.map(c => c.name.toLowerCase()));
        const newUniqueClients = importedClients.filter(ic => !existingNames.has(ic.name.toLowerCase()));
        
        setClients(prev => [...prev, ...newUniqueClients].sort((a,b) => a.name.localeCompare(b.name)));
        toast.success(`${newUniqueClients.length} novos clientes importados com sucesso!`, { id: toastId });

    } catch (error) {
        toast.error(String(error), { id: toastId });
    }
    event.target.value = '';
  };

  const lastVisitInfo = (client: Client) => {
      if (client.appointments.length === 0) return { date: 'N/A', procedure: 'N/A' };
      const lastAppt = [...client.appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return {
          date: new Date(lastAppt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }),
          procedure: lastAppt.procedure
      };
  }
  
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Gestão de Clientes</h2>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <input
                type="text"
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/2 p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all"
            />
            <div className='flex gap-2'>
                <label htmlFor="excel-upload" className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:scale-105 cursor-pointer text-center">
                    Importar Excel
                </label>
                <input id="excel-upload" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileImport} />
                <button
                    onClick={() => setAddModalOpen(true)}
                    className="w-full md:w-auto bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105"
                >
                    Adicionar Cliente
                </button>
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white/50 dark:bg-gray-800/50">
                <thead className="bg-white/30 dark:bg-gray-900/40">
                    <tr>
                        {['Nome', 'Telefone', 'Último Procedimento', 'Última Visita', 'Ações'].map(h => (
                            <th key={h} className="py-3 px-6 text-left text-gray-600 dark:text-gray-300 uppercase text-sm font-semibold tracking-wider">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-gray-200 text-sm">
                    {filteredClients.map((client) => {
                        const {date, procedure} = lastVisitInfo(client);
                        return (
                            <tr key={client.id} className="border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-brand-purple-100/30 dark:hover:bg-brand-purple-700/30 transition-colors">
                                <td className="py-4 px-6 whitespace-nowrap font-medium">{client.name}</td>
                                <td className="py-4 px-6">{client.phone}</td>
                                <td className="py-4 px-6">{procedure}</td>
                                <td className="py-4 px-6">{date}</td>
                                <td className="py-4 px-6 text-center">
                                    <div className='flex gap-2 justify-center'>
                                        <button
                                            onClick={() => handleViewDetails(client)}
                                            className="bg-brand-purple-500 text-white px-3 py-1 rounded-lg shadow hover:bg-brand-purple-700 transition-colors text-xs font-bold"
                                        >
                                            Detalhes
                                        </button>
                                         <button
                                            onClick={() => handleDeleteClient(client.id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-lg shadow hover:bg-red-700 transition-colors text-xs font-bold"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
        {clients.length > 0 && filteredClients.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6">Nenhum cliente encontrado com o termo da busca.</p>}
        {clients.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-6 p-8">Nenhum cliente cadastrado. Adicione seu primeiro cliente ou importe uma planilha do Excel.</p>}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Novo Cliente">
        <div className="space-y-4">
            <input type="text" placeholder="Nome Completo *" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink-300" />
            <input type="text" placeholder="Telefone *" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink-300" />
            <input type="email" placeholder="E-mail" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink-300" />
            <div className="relative">
                <label className="text-xs text-gray-500 dark:text-gray-400 absolute -top-2 left-2 bg-white dark:bg-gray-800 px-1">Data de Nascimento</label>
                <input type="date" value={newClient.birthDate} max={new Date().toISOString().split("T")[0]} onChange={e => setNewClient({...newClient, birthDate: e.target.value})} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink-300" />
            </div>
            <textarea placeholder="Dados da Anamnese (alergias, histórico, etc.)" value={newClient.anamnesis} onChange={e => setNewClient({...newClient, anamnesis: e.target.value})} rows={3} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-pink-300"></textarea>
            <button onClick={handleAddClient} className="w-full bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-colors">Salvar Cliente</button>
        </div>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Detalhes do Cliente">
        {selectedClient && (
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
                <p><strong>Nome:</strong> {selectedClient.name}</p>
                <p><strong>Telefone:</strong> {selectedClient.phone}</p>
                <p><strong>Email:</strong> {selectedClient.email || 'N/A'}</p>
                 <p><strong>Nascimento:</strong> {selectedClient.birthDate ? selectedClient.birthDate.split('-').reverse().join('/') : 'N/A'}</p>
                <p><strong>Anamnese:</strong> {selectedClient.anamnesis || 'N/A'}</p>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <h4 className="font-bold mb-2 text-lg">Histórico de Agendamentos</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {selectedClient.appointments.length > 0 ? [...selectedClient.appointments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (
                            <div key={appt.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm">
                                <p><strong>Procedimento:</strong> {appt.procedure}</p>
                                <p><strong>Data:</strong> {new Date(appt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })} | <strong>Valor:</strong> {appt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            </div>
                        )) : <p className="text-sm italic">Nenhum agendamento registrado.</p>}
                    </div>
                </div>
                 <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    <h4 className="font-bold mb-3 text-lg">Adicionar Novo Agendamento</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 col-span-2" />
                        <select value={newAppointment.procedure} onChange={e => setNewAppointment({...newAppointment, procedure: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 col-span-2">
                            <option value="">Selecione um Procedimento</option>
                            {procedures.map(proc => <option key={proc.id} value={proc.name}>{proc.name}</option>)}
                        </select>
                        <input type="number" placeholder="Preço (R$)" value={newAppointment.price || ''} onChange={e => setNewAppointment({...newAppointment, price: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600" />
                        <input type="number" placeholder="Custo (R$)" value={newAppointment.cost || ''} onChange={e => setNewAppointment({...newAppointment, cost: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600" />
                        <button onClick={handleAddAppointment} className="col-span-2 w-full bg-brand-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-purple-700 transition-colors">Adicionar Agendamento</button>
                    </div>
                 </div>
            </div>
        )}
      </Modal>

    </div>
  );
};