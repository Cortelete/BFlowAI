import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Appointment, Procedure } from '../types';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

interface SchedulingProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  procedures: Procedure[];
}

const emptyAppointment: Omit<Appointment, 'id' | 'date'> = { 
    procedure: '', price: 0, cost: 0, time: '' 
};

export const Scheduling: React.FC<SchedulingProps> = ({ clients, setClients, procedures }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);

  const [newApptClientId, setNewApptClientId] = useState<string>('');
  const [newApptDetails, setNewApptDetails] = useState(emptyAppointment);
  
  // Auto-fill price and cost when procedure changes
  useEffect(() => {
    const selectedProc = procedures.find(p => p.name === newApptDetails.procedure);
    if (selectedProc) {
      setNewApptDetails(prev => ({ ...prev, price: selectedProc.defaultPrice, cost: selectedProc.defaultCost }));
    }
  }, [newApptDetails.procedure, procedures]);

  const allAppointments = useMemo(() => {
    return clients
      .flatMap(client => client.appointments.map(appt => ({ ...appt, clientName: client.name })))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [clients]);

  const appointmentsByDay = useMemo(() => {
      const map = new Map<string, (Appointment & {clientName: string})[]>();
      allAppointments.forEach(appt => {
          const dateKey = appt.date;
          if(!map.has(dateKey)) {
              map.set(dateKey, []);
          }
          map.get(dateKey)!.push(appt);
      });
      return map;
  }, [allAppointments]);
  
  const handleDayClick = (day: number) => {
      const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
      setSelectedDate(date);
      setNewApptClientId('');
      setNewApptDetails(emptyAppointment);
      setModalOpen(true);
  }

  const handleSaveAppointment = () => {
      if (!newApptClientId || !newApptDetails.procedure) {
          toast.error("Cliente e Procedimento são obrigatórios.");
          return;
      }
      
      const appointmentToAdd: Appointment = {
          id: `appt-${Date.now()}`,
          date: selectedDate.toISOString().split('T')[0],
          ...newApptDetails
      };

      setClients(prevClients => 
          prevClients.map(client => {
              if (client.id === newApptClientId) {
                  return { ...client, appointments: [...client.appointments, appointmentToAdd] };
              }
              return client;
          })
      );
      
      toast.success("Agendamento salvo com sucesso!");
      setNewApptClientId('');
      setNewApptDetails(emptyAppointment);
      // Keep modal open to add more appointments
  }

  const startOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const endOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();

  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);
  const prefixDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const appointmentsForSelectedDay = appointmentsByDay.get(selectedDateString) || [];

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Agenda</h2>
        
        <div className="bg-white/20 dark:bg-black/30 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() - 1)))} className="font-bold p-2 rounded-full hover:bg-white/30">&lt;</button>
                <h3 className="font-bold text-xl text-center">{currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)))} className="font-bold p-2 rounded-full hover:bg-white/30">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="p-2 w-12">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {prefixDays.map((_, i) => <div key={`p-${i}`} className="h-12 w-12" />)}
                {daysInMonth.map(day => {
                    const dayString = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day).toISOString().split('T')[0];
                    const hasAppts = appointmentsByDay.has(dayString);
                    return (
                        <div key={day} onClick={() => handleDayClick(day)}
                             className={`p-2 h-12 w-12 rounded-full cursor-pointer relative transition-colors flex items-center justify-center hover:bg-brand-pink-100/50`}>
                            {day}
                            {hasAppts && <span className="absolute bottom-1 right-1 h-2 w-2 bg-brand-purple-500 rounded-full"></span>}
                        </div>
                    )
                })}
            </div>
        </div>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={`Agenda para ${selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
        maxWidth="max-w-lg"
      >
        <div className='max-h-96 overflow-y-auto pr-2'>
            <div className="space-y-3 mb-6">
                <h4 className='font-bold text-lg'>Agendamentos do Dia</h4>
                {appointmentsForSelectedDay.length > 0 ? (
                    appointmentsForSelectedDay.map(appt => (
                        <div key={appt.id} className="p-3 bg-brand-purple-100/50 dark:bg-brand-purple-500/20 rounded-lg flex justify-between">
                            <div>
                                <p className="font-semibold">{appt.procedure}</p>
                                <p className="text-sm">Cliente: {appt.clientName}</p>
                            </div>
                            {appt.time && <p className='font-bold text-brand-purple-700 dark:text-brand-purple-300'>{appt.time}</p>}
                        </div>
                    ))
                ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400">Nenhum atendimento para esta data.</p>
                )}
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-3 text-lg">Adicionar Novo Agendamento</h4>
                <div className="grid grid-cols-2 gap-3">
                    <select value={newApptClientId} onChange={e => setNewApptClientId(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600 col-span-2">
                        <option value="">Selecione um Cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={newApptDetails.procedure} onChange={e => setNewApptDetails({...newApptDetails, procedure: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600 col-span-2">
                        <option value="">Selecione um Procedimento</option>
                        {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <input type="time" value={newApptDetails.time || ''} onChange={e => setNewApptDetails({...newApptDetails, time: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                    <input type="number" placeholder="Preço (R$)" value={newApptDetails.price || ''} onChange={e => setNewApptDetails({...newApptDetails, price: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                    <button onClick={handleSaveAppointment} className="col-span-2 w-full bg-brand-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-pink-700 transition-colors">Salvar Agendamento</button>
                </div>
            </div>
        </div>
      </Modal>

    </div>
  );
};