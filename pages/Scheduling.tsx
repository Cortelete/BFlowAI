import React, { useState, useMemo } from 'react';
import type { Client, Appointment, Procedure, User } from '../types';
import { Icon } from '../components/common/Icon';
import AppointmentModal from '../components/scheduling/AppointmentModal';

interface SchedulingProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  procedures: Procedure[];
  currentUser: User;
}

export const Scheduling: React.FC<SchedulingProps> = ({ clients, setClients, procedures, currentUser }) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setModalOpen] = useState(false);

  const isProfessional = useMemo(() => 
    currentUser?.userType === 'Administrador' || 
    currentUser?.userType === 'Profissional Lash' || 
    currentUser?.userType === 'Funcionário',
  [currentUser]);

  const allAppointments = useMemo(() => {
    return clients
      .flatMap(client => client.appointments.map(appt => ({ ...appt, clientName: client.name, clientId: client.id })))
      .sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''));
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
  
  const handleDayClick = (day: number) => {
      const date = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
      setSelectedDate(date);
      setModalOpen(true);
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
      
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        clients={clients}
        setClients={setClients}
        procedures={procedures}
        appointmentsForSelectedDay={appointmentsForSelectedDay}
        isProfessional={isProfessional}
      />
    </div>
  );
};