

import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Appointment, Procedure } from '../types';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { Icon } from '../components/Icons';

interface SchedulingProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  procedures: Procedure[];
}

const emptyAppointment: Omit<Appointment, 'id' | 'date'> = {
    procedureName: '',
    category: '',
    startTime: '09:00',
    endTime: '10:00',
    professional: '',
    generalNotes: '',
    materials: [],
    equipmentUsed: '',
    procedureSteps: [],
    duration: 60,
    technique: '',
    difficulty: '',
    reactionDescription: '',
    tags: [],
    technicalNotes: '',
    value: 0,
    discount: 0,
    finalValue: 0,
    paymentMethod: '',
    status: 'Pendente',
    cost: 0,
    commission: 0,
    media: [],
    postProcedureInstructions: '',
    requiresReturn: false,
    consentSigned: false,
    imageAuthSigned: false,
    clientSatisfaction: 0,
    internalNotes: '',
    // Legacy fields for compatibility.
    procedure: '',
    price: 0,
    time: '09:00',
};

const StatusTag: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
    const statusStyles = {
        Pago: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        Pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
        Atrasado: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>{status}</span>;
};

export const Scheduling: React.FC<SchedulingProps> = ({ clients, setClients, procedures }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);

  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [newApptClientId, setNewApptClientId] = useState<string>('');
  const [newApptDetails, setNewApptDetails] = useState(emptyAppointment);
  
  // Auto-fill price, cost, and duration when procedure changes
  useEffect(() => {
    const selectedProc = procedures.find(p => p.name === newApptDetails.procedureName);
    if (selectedProc) {
      setNewApptDetails(prev => ({ 
          ...prev, 
          procedure: selectedProc.name, // legacy
          price: selectedProc.defaultPrice, // legacy
          value: selectedProc.defaultPrice,
          cost: selectedProc.defaultCost,
          duration: selectedProc.defaultDuration
        }));
    }
  }, [newApptDetails.procedureName, procedures]);
  
  const filteredClientsForSelect = useMemo(() => {
    if (!clientSearchTerm) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
  }, [clients, clientSearchTerm]);

  const allAppointments = useMemo(() => {
    return clients
      .flatMap(client => client.appointments.map(appt => ({ ...appt, clientName: client.name, clientId: client.id })))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [clients]);

  const appointmentsByDay = useMemo(() => {
      const map = new Map<string, (Appointment & {clientName: string; clientId: string;})[]>();
      allAppointments.forEach(appt => {
          const dateKey = appt.date;
          if(!map.has(dateKey)) {
              map.set(dateKey, []);
          }
          map.get(dateKey)!.push(appt);
      });
      return map;
  }, [allAppointments]);

  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const appointmentsForSelectedDay = appointmentsByDay.get(selectedDateString) || [];
  
  const availableTimeSlots = useMemo(() => {
    const startTime = 8 * 60; // 8:00 AM in minutes from midnight
    const endTime = 18 * 60; // 6:00 PM in minutes
    const interval = 30; // 30 minutes
    const newApptDuration = newApptDetails.duration || 30;

    const occupiedSlots = new Set<number>();
    appointmentsForSelectedDay.forEach(appt => {
        const [hour, minute] = (appt.startTime || appt.time).split(':').map(Number);
        const apptStartTime = hour * 60 + minute;
        const apptDuration = appt.duration;
        const numSlots = Math.ceil(apptDuration / interval);

        for (let i = 0; i < numSlots; i++) {
            occupiedSlots.add(apptStartTime + i * interval);
        }
    });

    const availableSlots = [];
    for (let slotStart = startTime; slotStart < endTime; slotStart += interval) {
        let isAvailable = true;
        const numSlotsNeeded = Math.ceil(newApptDuration / interval);

        for (let i = 0; i < numSlotsNeeded; i++) {
            const timeToCheck = slotStart + i * interval;
            if (occupiedSlots.has(timeToCheck) || (timeToCheck + interval) > endTime) {
                isAvailable = false;
                break;
            }
        }
        
        if (isAvailable) {
            const hour = Math.floor(slotStart / 60);
            const minute = slotStart % 60;
            availableSlots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }
    return availableSlots;
  }, [appointmentsForSelectedDay, newApptDetails.duration]);

  const handleDayClick = (day: number) => {
      const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
      setSelectedDate(date);
      setNewApptClientId('');
      setClientSearchTerm('');
      setNewApptDetails(emptyAppointment);
      setModalOpen(true);
  }

  const handleSaveAppointment = () => {
      if (!newApptClientId || !newApptDetails.procedureName || !newApptDetails.startTime) {
          toast.error("Cliente, Procedimento e Horário são obrigatórios.");
          return;
      }
      
      const finalValue = (newApptDetails.value || 0) - (newApptDetails.discount || 0);

      const appointmentToAdd: Appointment = {
          id: `appt-${Date.now()}`,
          date: selectedDate.toISOString().split('T')[0],
          ...newApptDetails,
          finalValue,
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
      setClientSearchTerm('');
      setNewApptDetails(emptyAppointment);
      // Keep modal open to add more appointments
  }

  const startOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
  const endOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();

  const daysInMonth = Array.from({ length: endOfMonth.getDate() }, (_, i) => i + 1);
  const prefixDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white mb-6">Agenda</h2>
        
        <div className="bg-white/20 dark:bg-black/30 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-black/50 transition-colors"><Icon icon="chevron-up" className="-rotate-90" /></button>
                <h3 className="font-bold text-xl text-center capitalize">{currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-black/50 transition-colors"><Icon icon="chevron-down" className="rotate-90" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-gray-500 dark:text-gray-400">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d} className="p-2 w-full">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {prefixDays.map((_, i) => <div key={`p-${i}`} className="h-14 w-full" />)}
                {daysInMonth.map(day => {
                    const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
                    date.setHours(0,0,0,0);
                    const dayString = date.toISOString().split('T')[0];
                    const hasAppts = appointmentsByDay.has(dayString);
                    const isToday = date.getTime() === today.getTime();
                    return (
                        <div key={day} onClick={() => handleDayClick(day)}
                             className={`p-2 h-14 w-full rounded-2xl cursor-pointer relative transition-all duration-300 flex items-center justify-center font-semibold border-2 ${isToday ? 'border-brand-pink-500' : 'border-transparent'} hover:bg-brand-pink-100/50 dark:hover:bg-brand-pink-500/20`}>
                            {day}
                            {hasAppts && <span className="absolute bottom-2 right-2 h-2.5 w-2.5 bg-brand-purple-500 rounded-full shadow-md"></span>}
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
        <div className='max-h-[70vh] overflow-y-auto p-1'>
            <div className="space-y-3 mb-6">
                <h4 className='font-bold text-lg'>Agendamentos do Dia</h4>
                {appointmentsForSelectedDay.length > 0 ? (
                    appointmentsForSelectedDay.map(appt => (
                        <div key={appt.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                {(appt.startTime || appt.time) && <p className='font-bold text-brand-purple-700 dark:text-brand-purple-300'>{appt.startTime || appt.time}</p>}
                                <div>
                                    <p className="font-semibold">{appt.procedureName || appt.procedure} ({appt.duration} min)</p>
                                    <p className="text-xs opacity-80">{appt.clientName}</p>
                                </div>
                            </div>
                            <StatusTag status={appt.status} />
                        </div>
                    ))
                ) : (
                    <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center py-4">Nenhum atendimento para esta data. Você pode adicionar abaixo.</p>
                )}
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-bold mb-3 text-lg">Adicionar Novo Agendamento</h4>
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Pesquisar cliente..."
                        value={clientSearchTerm}
                        onChange={e => setClientSearchTerm(e.target.value)}
                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600"
                    />
                    <select value={newApptClientId} onChange={e => setNewApptClientId(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                        <option value="">Selecione um Cliente</option>
                        {filteredClientsForSelect.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={newApptDetails.procedureName} onChange={e => setNewApptDetails({...newApptDetails, procedureName: e.target.value})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                        <option value="">Selecione um Procedimento</option>
                        {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        value={newApptDetails.startTime || ''} 
                        onChange={e => {
                            const newTime = e.target.value;
                            setNewApptDetails({ ...newApptDetails, startTime: newTime, time: newTime });
                          }}
                        disabled={availableTimeSlots.length === 0}
                        className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      >
                        <option value="">
                            {availableTimeSlots.length > 0 ? 'Selecione um Horário' : 'Nenhum horário disponível'}
                        </option>
                        {availableTimeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      <select value={newApptDetails.status} onChange={e => setNewApptDetails({...newApptDetails, status: e.target.value as Appointment['status']})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                          <option value="Pendente">Pendente</option>
                          <option value="Pago">Pago</option>
                          <option value="Atrasado">Atrasado</option>
                      </select>
                    </div>
                     <div className="grid grid-cols-3 gap-3">
                        <input type="number" placeholder="Preço (R$)" value={newApptDetails.value || ''} onChange={e => {
                            const newValue = parseFloat(e.target.value) || 0;
                            setNewApptDetails({...newApptDetails, value: newValue, price: newValue });
                        }} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                        <input type="number" placeholder="Custo (R$)" value={newApptDetails.cost || ''} onChange={e => setNewApptDetails({...newApptDetails, cost: parseFloat(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                        <input type="number" placeholder="Duração (min)" value={newApptDetails.duration || ''} onChange={e => setNewApptDetails({...newApptDetails, duration: parseInt(e.target.value) || 0})} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                    </div>
                    <button onClick={handleSaveAppointment} className="w-full bg-brand-pink-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-brand-pink-700 transition-colors">Salvar Agendamento</button>
                </div>
            </div>
        </div>
      </Modal>

    </div>
  );
};
