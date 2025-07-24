import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Client, Appointment, User, Procedure, AnamnesisRecord, ProcedureImage, MaterialUsed, ProcedureStep } from '../types';
import { Icon } from '../components/Icons';
import { toast } from 'react-hot-toast';

// Reusable form components from Clients page
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
const CheckboxField = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" {...props} className="h-4 w-4 rounded text-brand-pink-500 focus:ring-brand-pink-500 border-gray-300" />
        {label}
    </label>
);
const SelectField = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <select {...props} className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-brand-pink-500 appearance-none">
            {children}
        </select>
    </div>
);


// Helper function to extract critical anamnesis info
const getAnamnesisAlerts = (anamnesis: AnamnesisRecord): string[] => {
    const alerts: string[] = [];
    if (!anamnesis) return alerts;

    if (anamnesis.allergies?.lashGlue) alerts.push("Alergia: Cola de Cílios!");
    if (anamnesis.allergies?.latex) alerts.push("Alergia: Látex");
    if (anamnesis.allergies?.cosmetics) alerts.push("Alergia: Cosméticos");
    if (anamnesis.healthHistory?.hypertension) alerts.push("Saúde: Hipertensão");
    if (anamnesis.healthHistory?.heartDisease) alerts.push("Saúde: Doença Cardíaca");
    if (anamnesis.healthHistory?.diabetes) alerts.push("Saúde: Diabetes");
    if (anamnesis.medications?.roaccutane) alerts.push("Medicação: Roacutan recente");
    
    return alerts;
}

// Format elapsed time
const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};


interface AtendimentoProps {
    allClients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    currentUser: User;
    procedures: Procedure[];
}

export const Atendimento: React.FC<AtendimentoProps> = ({ allClients, setClients, currentUser, procedures }) => {
    const { clientId, appointmentId } = useParams<{ clientId: string, appointmentId: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<Client | null>(null);
    const [sessionAppointment, setSessionAppointment] = useState<Appointment | null>(null);
    const [activeTab, setActiveTab] = useState('technical');
    
    const [timer, setTimer] = useState({ start: 0, elapsed: 0, isRunning: false });

    useEffect(() => {
        const foundClient = allClients.find(c => c.id === clientId);
        if (foundClient) {
            const foundAppointment = foundClient.appointments.find(a => a.id === appointmentId);
            if (foundAppointment) {
                setClient(foundClient);
                setSessionAppointment({
                    ...foundAppointment,
                    professional: foundAppointment.professional || currentUser.fullName || currentUser.username,
                    procedureSteps: foundAppointment.procedureSteps.length > 0 ? foundAppointment.procedureSteps : [{id: 'step1', name: 'Higienização', done: false}, {id: 'step2', name: 'Aplicação', done: false}, {id: 'step3', name: 'Finalização', done: false}]
                });
            } else {
                 navigate('/schedule'); // Appointment not found
            }
        } else {
            navigate('/schedule'); // Client not found
        }
    }, [clientId, appointmentId, allClients, currentUser, navigate]);

    // Timer logic
    useEffect(() => {
        let interval: number | undefined;
        if (timer.isRunning) {
            interval = window.setInterval(() => {
                setTimer(t => ({ ...t, elapsed: Date.now() - t.start }));
            }, 1000);
        }
        return () => window.clearInterval(interval);
    }, [timer.isRunning, timer.start]);

    // Auto-calculation logic
    useEffect(() => {
        if (sessionAppointment) {
            // Final Value
            const final = (sessionAppointment.value || 0) - (sessionAppointment.discount || 0);
            if (final !== sessionAppointment.finalValue) {
                setSessionAppointment(prev => prev ? {...prev, finalValue: final} : null);
            }

            // End Time
            const { startTime, duration } = sessionAppointment;
            if (startTime && duration) {
                const [hours, minutes] = startTime.split(':').map(Number);
                if (!isNaN(hours) && !isNaN(minutes)) {
                    const startDate = new Date();
                    startDate.setHours(hours, minutes, 0, 0);
                    const endDate = new Date(startDate.getTime() + duration * 60000);
                    const endHours = String(endDate.getHours()).padStart(2, '0');
                    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
                    const newEndTime = `${endHours}:${endMinutes}`;
                    if(newEndTime !== sessionAppointment.endTime){
                       setSessionAppointment(prev => prev ? { ...prev, endTime: newEndTime } : null);
                    }
                }
            }
        }
    }, [sessionAppointment]);


    const handleTimerToggle = () => {
        if (timer.isRunning) {
            setTimer(t => ({ ...t, isRunning: false }));
        } else {
            setTimer(t => ({ ...t, isRunning: true, start: Date.now() - t.elapsed }));
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        if (!sessionAppointment) return;

        const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    type === 'number' ? parseFloat(value) || 0 : value;
        
        setSessionAppointment(prev => prev ? {...prev, [name]: val} : null);
    };

    const handleMaterialChange = (index: number, field: keyof MaterialUsed, value: any) => {
        if (!sessionAppointment) return;
        const newMaterials = [...sessionAppointment.materials];
        newMaterials[index] = {...newMaterials[index], [field]: value};
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setSessionAppointment(prev => prev ? {...prev, materials: newMaterials, cost: totalCost} : null);
    }
    
    const addMaterial = () => {
        if (!sessionAppointment) return;
        setSessionAppointment(prev => prev ? {...prev, materials: [...prev.materials, {id: `mat-${Date.now()}`, name: '', quantity: '1', unit: 'un', cost: 0}]} : null);
    }

    const removeMaterial = (index: number) => {
        if (!sessionAppointment) return;
        const newMaterials = sessionAppointment.materials.filter((_, i) => i !== index);
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setSessionAppointment(prev => prev ? {...prev, materials: newMaterials, cost: totalCost} : null);
    }

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: ProcedureImage['type']) => {
        const file = e.target.files?.[0];
        if(file && sessionAppointment) {
            const toastId = toast.loading("Carregando imagem...");
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage: ProcedureImage = { id: `img-${Date.now()}`, url: event.target?.result as string, type, caption: '' };
                setSessionAppointment(prev => prev ? {...prev, media: [...prev.media, newImage]} : null);
                toast.success("Imagem carregada!", {id: toastId});
            }
            reader.onerror = () => {
                toast.error("Falha ao carregar imagem.", {id: toastId});
            }
            reader.readAsDataURL(file);
        }
    }

    const removeImage = (id: string) => {
        if (!sessionAppointment) return;
        setSessionAppointment(prev => prev ? {...prev, media: prev.media.filter(img => img.id !== id)} : null);
    }

    const handleStepToggle = (stepId: string) => {
        if (!sessionAppointment) return;
        setSessionAppointment(prev => prev ? {...prev, procedureSteps: prev.procedureSteps.map(s => s.id === stepId ? {...s, done: !s.done} : s)} : null);
    }

    const handleSaveSession = () => {
        if (!client || !sessionAppointment) {
            toast.error("Não foi possível encontrar os dados da sessão.");
            return;
        }

        // Add elapsed time to duration if timer ran
        const finalAppointment = {
            ...sessionAppointment,
            duration: timer.elapsed > 0 ? (sessionAppointment.duration + Math.floor(timer.elapsed / 60000)) : sessionAppointment.duration
        };
        
        setClients(prevClients => 
            prevClients.map(c => {
                if (c.id === client.id) {
                    return { ...c, appointments: c.appointments.map(a => a.id === finalAppointment.id ? finalAppointment : a) };
                }
                return c;
            })
        );
        
        toast.success("Atendimento finalizado e salvo!");
        navigate(`/schedule`);
    }

    const anamnesisAlerts = useMemo(() => client ? getAnamnesisAlerts(client.anamnesis) : [], [client]);

    if (!client || !sessionAppointment) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-bold">Carregando dados do atendimento...</h2>
                <p>Se esta mensagem persistir, o agendamento pode ser inválido.</p>
                <Link to="/schedule" className="mt-4 inline-block bg-brand-pink-500 text-white font-bold py-2 px-4 rounded-lg">Voltar para a Agenda</Link>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel */}
            <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start space-y-6">
                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl shadow-lg text-center">
                     <img src={client.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=8E44AD&color=fff&size=128`} alt={client.name} className="w-20 h-20 rounded-full mx-auto object-cover shadow-lg mb-3" />
                     <h3 className="text-xl font-bold">{client.name}</h3>
                     <p className="text-sm opacity-70 mb-2 truncate px-2">{sessionAppointment.procedureName}</p>
                     <Link to={`/clients`} state={{ selectedClientId: client.id }} className="text-xs text-brand-purple-500 dark:text-brand-purple-300 hover:underline">Ver Perfil Completo</Link>
                </div>
                
                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl shadow-lg text-center">
                    <h4 className="font-bold mb-2">Cronômetro da Sessão</h4>
                    <p className="font-mono text-4xl font-bold text-brand-pink-500 dark:text-brand-pink-300 my-2">{formatTime(timer.elapsed)}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={handleTimerToggle} className="p-3 bg-brand-purple-500 text-white rounded-full shadow-lg hover:bg-brand-purple-700 transition-colors">
                            <Icon icon={timer.isRunning ? 'pause' : 'play'} className={'h-5 w-5'} />
                        </button>
                        <button onClick={() => setTimer({start: 0, elapsed: 0, isRunning: false})} className="p-3 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors">
                            <Icon icon="refresh-cw" className="h-5 w-5"/>
                        </button>
                    </div>
                </div>

                {anamnesisAlerts.length > 0 && (
                    <div className="bg-yellow-100/50 dark:bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-xl shadow-lg">
                        <h4 className="font-bold flex items-center gap-2"><Icon icon="alert-circle" className="text-yellow-600 dark:text-yellow-400"/> Alertas da Anamnese</h4>
                        <ul className="list-disc list-inside mt-2 text-sm space-y-1 text-left">
                            {anamnesisAlerts.map((alert, i) => <li key={i}>{alert}</li>)}
                        </ul>
                    </div>
                )}
                
                 <nav className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl shadow-lg space-y-2">
                    <button onClick={() => setActiveTab('technical')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === 'technical' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Icon icon="clipboard" className="w-5 h-5"/>Ficha Técnica</button>
                    <button onClick={() => setActiveTab('financial')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === 'financial' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Icon icon="dollar-sign" className="w-5 h-5"/>Financeiro</button>
                    <button onClick={() => setActiveTab('media')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === 'media' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Icon icon="camera" className="w-5 h-5"/>Mídia</button>
                    <button onClick={() => setActiveTab('post')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${activeTab === 'post' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><Icon icon="file-text" className="w-5 h-5"/>Pós-Atendimento</button>
                 </nav>

                 <button onClick={handleSaveSession} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-brand-pink-700 transition-colors flex items-center justify-center gap-2">
                    <Icon icon="check-circle" className="w-5 h-5" /> Finalizar e Salvar
                 </button>
            </aside>

            {/* Right Panel */}
            <section className="lg:col-span-3 bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg space-y-6">
                {activeTab === 'technical' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-bold text-xl mb-4">Ficha Técnica do Procedimento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Técnica Aplicada" name="technique" placeholder="Ex: Fio a Fio, Volume Russo..." value={sessionAppointment.technique} onChange={handleChange}/>
                            <InputField label="Duração (min)" type="number" name="duration" value={sessionAppointment.duration} onChange={handleChange}/>
                        </div>
                        <div className="my-4">
                            <h5 className="font-semibold mb-2">Etapas Executadas</h5>
                            <div className="space-y-2 p-3 bg-white/10 rounded-lg">
                                {sessionAppointment.procedureSteps.map(step => <CheckboxField key={step.id} label={step.name} checked={step.done} onChange={() => handleStepToggle(step.id)} />)}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold mb-2">Materiais Utilizados (Custo Total: {sessionAppointment.cost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})</h5>
                            <div className="p-3 bg-white/10 rounded-lg space-y-2">
                                {sessionAppointment.materials.map((mat, index) => (
                                    <div key={mat.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                                        <input type="text" placeholder="Nome" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-3 p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <input type="number" placeholder="Custo" value={mat.cost || ''} onChange={e => handleMaterialChange(index, 'cost', parseFloat(e.target.value) || 0)} className="col-span-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm"/>
                                        <button onClick={() => removeMaterial(index)} className="text-red-500 font-bold text-lg hover:text-red-700">×</button>
                                    </div>
                                ))}
                                <button onClick={addMaterial} className="text-sm text-blue-500 font-semibold">+ Adicionar Material</button>
                            </div>
                        </div>
                        <TextAreaField label="Observações Técnicas" name="technicalNotes" value={sessionAppointment.technicalNotes} onChange={handleChange} rows={4} />
                    </div>
                )}
                {activeTab === 'financial' && (
                    <div className="space-y-6 animate-fade-in">
                         <h3 className="font-bold text-xl mb-4">Financeiro</h3>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Valor (R$)" type="number" name="value" value={sessionAppointment.value} onChange={handleChange}/>
                            <InputField label="Desconto (R$)" type="number" name="discount" value={sessionAppointment.discount} onChange={handleChange}/>
                            <InputField label="Valor Final (R$)" type="number" value={sessionAppointment.finalValue} disabled className="!bg-gray-200 dark:!bg-gray-800"/>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <SelectField label="Forma de Pagamento" name="paymentMethod" value={sessionAppointment.paymentMethod} onChange={handleChange}>
                                <option value="">Selecione...</option>
                                <option>Dinheiro</option><option>Pix</option><option>Cartão Crédito/Débito</option><option>Transferência</option><option>Cortesia</option>
                            </SelectField>
                            <SelectField label="Status do Pagamento" name="status" value={sessionAppointment.status} onChange={handleChange}>
                                <option>Pendente</option><option>Pago</option><option>Atrasado</option>
                            </SelectField>
                         </div>
                         <div>
                             <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">Satisfação da Cliente</label>
                             <div className="flex">
                                {[1,2,3,4,5].map(star => <button key={star} onClick={() => setSessionAppointment({...sessionAppointment, clientSatisfaction: star})} className={`text-3xl transition-transform hover:scale-125 ${star <= sessionAppointment.clientSatisfaction ? 'text-yellow-400' : 'text-gray-400'}`}>★</button>)}
                             </div>
                         </div>
                    </div>
                )}
                 {activeTab === 'media' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="font-bold text-xl mb-4">Mídia do Atendimento</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-white/10 rounded-lg">
                                <label className="block text-sm font-medium mb-2">Adicionar Foto "Antes"</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Antes')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-pink-50 file:text-brand-pink-700 hover:file:bg-brand-pink-100"/>
                            </div>
                            <div className="p-4 bg-white/10 rounded-lg">
                                <label className="block text-sm font-medium mb-2">Adicionar Foto "Depois"</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Depois')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-purple-50 file:text-brand-purple-700 hover:file:bg-brand-purple-100"/>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sessionAppointment.media.map(img => (
                                <div key={img.id} className="relative group aspect-square">
                                    <img src={img.url} alt={img.type} className="w-full h-full rounded-lg object-cover shadow-md"/>
                                    <p className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg font-bold">{img.type}</p>
                                    <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                </div>
                            ))}
                        </div>
                         {sessionAppointment.media.length === 0 && <p className="text-sm italic text-center py-8">Nenhuma imagem adicionada.</p>}
                    </div>
                )}
                 {activeTab === 'post' && (
                    <div className="space-y-6 animate-fade-in">
                         <h3 className="font-bold text-xl mb-4">Cuidados e Retorno</h3>
                         <TextAreaField label="Instruções Pós-Procedimento para a Cliente" name="postProcedureInstructions" value={sessionAppointment.postProcedureInstructions} onChange={handleChange} rows={6}/>
                         <div className="mt-4 flex gap-4 items-center">
                             <CheckboxField label="Necessita Retorno?" checked={sessionAppointment.requiresReturn} onChange={e => setSessionAppointment({...sessionAppointment, requiresReturn: e.target.checked})}/>
                             {sessionAppointment.requiresReturn && <InputField label="Data do Retorno" type="date" name="returnDate" value={sessionAppointment.returnDate || ''} onChange={handleChange}/>}
                         </div>
                    </div>
                )}
            </section>
        </div>
    );
};
