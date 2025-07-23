
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Client, Appointment, User, MaterialUsed } from '../types';
import { Icon } from '../components/Icons';
import { toast } from 'react-hot-toast';

interface ServiceSessionProps {
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    currentUser: User;
}

export const ServiceSession: React.FC<ServiceSessionProps> = ({ clients, setClients, currentUser }) => {
    const { clientId, appointmentId } = useParams<{ clientId: string; appointmentId: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<Client | null>(null);
    const [appointment, setAppointment] = useState<Appointment | null>(null);

    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    
    // Find the client and appointment on component mount or when params change
    useEffect(() => {
        const foundClient = clients.find(c => c.id === clientId);
        if (foundClient) {
            setClient(foundClient);
            const foundAppointment = foundClient.appointments.find(a => a.id === appointmentId);
            if (foundAppointment) {
                setAppointment(foundAppointment);
            } else {
                toast.error("Agendamento não encontrado!");
                navigate('/schedule');
            }
        } else {
            toast.error("Cliente não encontrado!");
            navigate('/schedule');
        }
    }, [clientId, appointmentId, clients, navigate]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setTimer(seconds => seconds + 1);
            }, 1000);
        } else if (!isActive && timer !== 0) {
            clearInterval(interval!);
        }
        return () => clearInterval(interval!);
    }, [isActive, timer]);

    const formatTime = (timeInSeconds: number) => {
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = timeInSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleUpdateAppointment = (field: keyof Appointment, value: any) => {
        setAppointment(prev => prev ? { ...prev, [field]: value } : null);
    };

    const addMaterial = () => {
        if (!appointment) return;
        const newMaterial: MaterialUsed = { id: `mat-session-${Date.now()}`, name: '', quantity: '1', unit: 'un', cost: 0 };
        handleUpdateAppointment('materials', [...appointment.materials, newMaterial]);
    };

    const removeMaterial = (id: string) => {
        if (!appointment) return;
        handleUpdateAppointment('materials', appointment.materials.filter(m => m.id !== id));
    };

    const handleMaterialChange = (id: string, field: keyof MaterialUsed, value: any) => {
        if (!appointment) return;
        const updatedMaterials = appointment.materials.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        );
        handleUpdateAppointment('materials', updatedMaterials);
    };

    const handleFinalize = () => {
        if (!client || !appointment) return;
        
        setIsActive(false);
        const durationInMinutes = Math.round(timer / 60);
        
        const finalCost = appointment.materials.reduce((sum, m) => sum + m.cost, 0);

        const updatedAppointment: Appointment = {
            ...appointment,
            duration: durationInMinutes,
            cost: finalCost,
            professional: currentUser.fullName || currentUser.username
        };

        const updatedClients = clients.map(c => {
            if (c.id === client.id) {
                return {
                    ...c,
                    appointments: c.appointments.map(a => a.id === appointment.id ? updatedAppointment : a)
                };
            }
            return c;
        });

        setClients(updatedClients);
        toast.success("Atendimento finalizado e salvo com sucesso!");
        navigate(`/clients`);
    };

    const anamnesisAlerts = useMemo(() => {
        if (!client) return [];
        const alerts: string[] = [];
        const { healthHistory, allergies } = client.anamnesis;
        if(healthHistory.keloids) alerts.push("Tendência a queloides");
        if(healthHistory.heartDisease) alerts.push("Doenças cardíacas");
        if(allergies.lashGlue) alerts.push("Alergia a cola de cílios");
        if(allergies.latex) alerts.push("Alergia a látex");
        if(allergies.cosmetics) alerts.push("Alergia a cosméticos");
        return alerts;
    }, [client]);

    if (!client || !appointment) {
        return <div className="p-6 text-center">Carregando dados do atendimento...</div>;
    }

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Atendimento em Andamento</h2>
                        <p className="text-gray-600 dark:text-gray-300">Cliente: {client.name} | Procedimento: {appointment.procedureName}</p>
                    </div>
                    <button onClick={handleFinalize} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 transition-all flex items-center gap-2">
                        <Icon icon="check-circle" className="w-5 h-5"/> Finalizar e Salvar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Client Info */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-white/20 dark:bg-black/30 rounded-xl text-center">
                            <img src={client.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=8E44AD&color=fff&size=128`} alt={client.name} className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg mb-2" />
                            <h3 className="text-xl font-bold">{client.name}</h3>
                            <p className="text-sm opacity-80">{client.appointments.length}ª visita</p>
                        </div>
                        {anamnesisAlerts.length > 0 && (
                            <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-xl">
                                <h4 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2"><Icon icon="alert-circle" /> Alertas Importantes</h4>
                                <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm mt-2">
                                    {anamnesisAlerts.map(alert => <li key={alert}>{alert}</li>)}
                                </ul>
                            </div>
                        )}
                         <div className="p-4 bg-white/20 dark:bg-black/30 rounded-xl text-center">
                            <p className="text-sm font-semibold uppercase opacity-70">Status do Pagamento</p>
                            <p className={`text-lg font-bold ${appointment.status === 'Pago' ? 'text-green-500' : 'text-yellow-500'}`}>{appointment.status}</p>
                         </div>
                    </div>

                    {/* Right Panel: Session Details */}
                    <div className="lg:col-span-2 space-y-4 p-4 bg-white/20 dark:bg-black/30 rounded-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-brand-purple-100 dark:bg-brand-purple-900/50 rounded-lg">
                            <div className="text-center">
                                <p className="font-bold text-3xl font-mono text-brand-purple-800 dark:text-brand-purple-200">{formatTime(timer)}</p>
                                <p className="text-xs font-semibold uppercase text-brand-purple-700 dark:text-brand-purple-300">Tempo Decorrido</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsActive(true)} disabled={isActive} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-50">Iniciar</button>
                                <button onClick={() => setIsActive(false)} disabled={!isActive} className="bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-yellow-700 transition-all disabled:opacity-50">Pausar</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Materiais Utilizados na Sessão</h4>
                            <div className="space-y-2">
                                {appointment.materials.map((mat, index) => (
                                    <div key={mat.id} className="grid grid-cols-5 gap-2 items-center">
                                        <input type="text" placeholder="Nome do Material" value={mat.name} onChange={(e) => handleMaterialChange(mat.id, 'name', e.target.value)} className="col-span-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <input type="text" placeholder="Qtd" value={mat.quantity} onChange={(e) => handleMaterialChange(mat.id, 'quantity', e.target.value)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <input type="number" placeholder="Custo" value={mat.cost || ''} onChange={(e) => handleMaterialChange(mat.id, 'cost', parseFloat(e.target.value) || 0)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <button onClick={() => removeMaterial(mat.id)} className="text-red-500 font-bold text-lg">×</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addMaterial} className="text-sm text-blue-500 font-semibold mt-2">+ Adicionar Material</button>
                        </div>
                        
                        <div>
                            <label className="font-semibold mb-1 block">Anotações da Sessão</label>
                            <textarea 
                                value={appointment.internalNotes}
                                onChange={(e) => handleUpdateAppointment('internalNotes', e.target.value)}
                                rows={4}
                                placeholder="Registre intercorrências, observações sobre a pele/cílios, ou qualquer detalhe relevante sobre este atendimento..."
                                className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
