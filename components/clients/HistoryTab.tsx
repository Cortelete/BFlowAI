import React, { useState } from 'react';
import type { Client, Appointment, Procedure, User } from '../../types';
import { createEmptyAppointment } from '../../services/clientService';
import toast from 'react-hot-toast';
import AppointmentRecordModal from './AppointmentRecordModal';
import { Icon } from '../common/Icon';

interface HistoryTabProps {
    client: Client;
    setClient: React.Dispatch<React.SetStateAction<Client>>;
    procedures: Procedure[];
    currentUser: User;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ client, setClient, procedures, currentUser }) => {
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
                return { ...prev, appointments: prev.appointments.map(a => a.id === updatedAppt.id ? updatedAppt : a) }
            }
            return { ...prev, appointments: [...prev.appointments, updatedAppt] };
        });
        setApptModalOpen(false);
        setSelectedAppt(null);
    }

    const handleDeleteAppointment = (apptId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este registro de atendimento?")) {
            setClient(prev => ({ ...prev, appointments: prev.appointments.filter(a => a.id !== apptId) }));
            toast.success("Atendimento excluído.");
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">Histórico de Atendimentos</h3>
                <button onClick={handleOpenNewAppointment} className="bg-brand-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-purple-700 transition-all flex items-center gap-2 text-sm">
                    <Icon icon="plus" className="w-4 h-4" /> Registrar Atendimento
                </button>
            </div>
            <div className="space-y-3">
                {[...client.appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(appt => (
                    <div key={appt.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg flex justify-between items-center text-sm transition-all hover:shadow-md">
                        <div>
                            <p className="font-bold">{appt.procedureName}</p>
                            <p className="text-xs opacity-70">{new Date(appt.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {(appt.finalValue || appt.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${appt.status === 'Pago' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'}`}>{appt.status}</span>
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

export default HistoryTab;
