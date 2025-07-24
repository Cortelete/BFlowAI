import React, { useState, useMemo, useEffect } from 'react';
import type { Client, Appointment, Procedure } from '../../types';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import StatusTag from './StatusTag';
import { Link } from 'react-router-dom';
import { Icon } from '../common/Icon';

const emptyAppointment: Omit<Appointment, 'id' | 'date'> = {
    procedureName: '', category: '', startTime: '09:00', endTime: '10:00', professional: '',
    generalNotes: '', materials: [], equipmentUsed: '', procedureSteps: [], duration: 60,
    technique: '', difficulty: '', reactionDescription: '', tags: [], technicalNotes: '', value: 0,
    discount: 0, finalValue: 0, paymentMethod: '', status: 'Pendente', cost: 0, commission: 0, media: [],
    postProcedureInstructions: '', requiresReturn: false, consentSigned: false, imageAuthSigned: false,
    clientSatisfaction: 0, internalNotes: '', procedure: '', price: 0, time: '09:00',
};

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    procedures: Procedure[];
    appointmentsForSelectedDay: (Appointment & { clientName: string; clientId: string; })[];
    isProfessional: boolean;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, selectedDate, clients, setClients, procedures, appointmentsForSelectedDay, isProfessional }) => {
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [newApptClientId, setNewApptClientId] = useState<string>('');
    const [newApptDetails, setNewApptDetails] = useState(emptyAppointment);

    useEffect(() => {
        const selectedProc = procedures.find(p => p.name === newApptDetails.procedureName);
        if (selectedProc) {
            setNewApptDetails(prev => ({
                ...prev, procedure: selectedProc.name, price: selectedProc.defaultPrice,
                value: selectedProc.defaultPrice, cost: selectedProc.defaultCost, duration: selectedProc.defaultDuration
            }));
        }
    }, [newApptDetails.procedureName, procedures]);

    const filteredClientsForSelect = useMemo(() => {
        if (!clientSearchTerm) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
    }, [clients, clientSearchTerm]);

    const availableTimeSlots = useMemo(() => {
        const startTime = 8 * 60; const endTime = 18 * 60; const interval = 30;
        const newApptDuration = newApptDetails.duration || 30;
        const occupiedSlots = new Set<number>();

        appointmentsForSelectedDay.forEach(appt => {
            const [hour, minute] = (appt.startTime || appt.time).split(':').map(Number);
            const apptStartTime = hour * 60 + minute;
            const numSlots = Math.ceil(appt.duration / interval);
            for (let i = 0; i < numSlots; i++) occupiedSlots.add(apptStartTime + i * interval);
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

    const handleSaveAppointment = () => {
        if (!newApptClientId || !newApptDetails.procedureName || !newApptDetails.startTime) {
            toast.error("Cliente, Procedimento e Horário são obrigatórios.");
            return;
        }

        const finalValue = (newApptDetails.value || 0) - (newApptDetails.discount || 0);
        const appointmentToAdd: Appointment = {
            id: `appt-${Date.now()}`, date: selectedDate.toISOString().split('T')[0], ...newApptDetails, finalValue,
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
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
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
                                <div className="flex items-center gap-2">
                                    <StatusTag status={appt.status} />
                                    {isProfessional && (
                                        <Link to={`/atendimento/${appt.clientId}/${appt.id}`} title="Iniciar Atendimento" className="bg-brand-pink-500 text-white p-2 rounded-lg shadow hover:bg-brand-pink-700 transition-colors">
                                            <Icon icon="play" className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center py-4">Nenhum atendimento para esta data.</p>
                    )}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-3 text-lg">Adicionar Novo Agendamento</h4>
                    <div className="space-y-3">
                        <input type="text" placeholder="Pesquisar cliente..." value={clientSearchTerm} onChange={e => setClientSearchTerm(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                        <select value={newApptClientId} onChange={e => setNewApptClientId(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                            <option value="">Selecione um Cliente</option>
                            {filteredClientsForSelect.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={newApptDetails.procedureName} onChange={e => setNewApptDetails({ ...newApptDetails, procedureName: e.target.value })} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                            <option value="">Selecione um Procedimento</option>
                            {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                            <select value={newApptDetails.startTime || ''} onChange={e => { const newTime = e.target.value; setNewApptDetails({ ...newApptDetails, startTime: newTime, time: newTime }); }} disabled={availableTimeSlots.length === 0} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600 disabled:opacity-50">
                                <option value="">{availableTimeSlots.length > 0 ? 'Selecione um Horário' : 'Sem horários'}</option>
                                {availableTimeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                            <select value={newApptDetails.status} onChange={e => setNewApptDetails({ ...newApptDetails, status: e.target.value as Appointment['status'] })} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600">
                                <option>Pendente</option><option>Pago</option><option>Atrasado</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <input type="number" placeholder="Preço (R$)" value={newApptDetails.value || ''} onChange={e => { const v = parseFloat(e.target.value) || 0; setNewApptDetails({ ...newApptDetails, value: v, price: v }); }} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                            <input type="number" placeholder="Custo (R$)" value={newApptDetails.cost || ''} onChange={e => setNewApptDetails({ ...newApptDetails, cost: parseFloat(e.target.value) || 0 })} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                            <input type="number" placeholder="Duração (min)" value={newApptDetails.duration || ''} onChange={e => setNewApptDetails({ ...newApptDetails, duration: parseInt(e.target.value) || 0 })} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-gray-300 dark:border-gray-600" />
                        </div>
                        <button onClick={handleSaveAppointment} className="w-full bg-brand-pink-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-brand-pink-700 transition-colors">Salvar Agendamento</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AppointmentModal;
