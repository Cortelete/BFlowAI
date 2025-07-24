import React, { useState, useEffect, ChangeEvent } from 'react';
import type { Appointment, Procedure, User, MaterialUsed, ProcedureImage } from '../../types';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import TextAreaField from '../common/TextAreaField';
import CheckboxField from '../common/CheckboxField';


interface AppointmentRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    onSave: (appt: Appointment) => void;
    procedures: Procedure[];
    currentUser: User;
}

const AppointmentRecordModal: React.FC<AppointmentRecordModalProps> = ({ isOpen, onClose, appointment, onSave, procedures, currentUser }) => {
    const [record, setRecord] = useState<Appointment>(appointment);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        // Auto-calculate final value when value or discount changes
        const final = (record.value || 0) - (record.discount || 0);
        setRecord(prev => ({ ...prev, finalValue: final }));
    }, [record.value, record.discount, record.cost])

    // Auto-fill details from procedure template
    useEffect(() => {
        const selectedProc = procedures.find(p => p.name === record.procedureName);
        if (selectedProc) {
            setRecord(prev => ({
                ...prev,
                category: selectedProc.category,
                value: selectedProc.defaultPrice,
                cost: selectedProc.defaultCost,
                duration: selectedProc.defaultDuration,
                postProcedureInstructions: selectedProc.defaultPostProcedureInstructions,
                procedureSteps: prev.procedureSteps.length > 0 ? prev.procedureSteps : [ // Keep existing steps if already there
                    { id: 'step1', name: 'Higienização', done: false },
                    { id: 'step2', name: 'Aplicação', done: false },
                    { id: 'step3', name: 'Finalização', done: false },
                ]
            }));
        }
    }, [record.procedureName, procedures]);

    // Auto-calculate end time
    useEffect(() => {
        if (record.startTime && record.duration) {
            const [hours, minutes] = record.startTime.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0, 0);
                const endDate = new Date(startDate.getTime() + record.duration * 60000);
                const endHours = String(endDate.getHours()).padStart(2, '0');
                const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
                setRecord(prev => ({ ...prev, endTime: `${endHours}:${endMinutes}` }));
            }
        }
    }, [record.startTime, record.duration]);


    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? parseFloat(value) || 0 : value;
        setRecord(prev => ({ ...prev, [name]: val }));
    };

    const handleMaterialChange = (index: number, field: keyof MaterialUsed, value: any) => {
        const newMaterials = [...record.materials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setRecord(prev => ({ ...prev, materials: newMaterials, cost: totalCost }));
    }

    const addMaterial = () => {
        setRecord(prev => ({ ...prev, materials: [...prev.materials, { id: `mat-${Date.now()}`, name: '', quantity: '1', unit: 'un', cost: 0, lotNumber: '', expirationDate: '' }] }));
    }

    const removeMaterial = (index: number) => {
        const newMaterials = record.materials.filter((_, i) => i !== index);
        const totalCost = newMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
        setRecord(prev => ({ ...prev, materials: newMaterials, cost: totalCost }));
    }

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, type: ProcedureImage['type']) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage: ProcedureImage = { id: `img-${Date.now()}`, url: event.target?.result as string, type, caption: '' };
                setRecord(prev => ({ ...prev, media: [...prev.media, newImage] }));
            }
            reader.readAsDataURL(file);
        }
    }

    const removeImage = (id: string) => {
        setRecord(prev => ({ ...prev, media: prev.media.filter(img => img.id !== id) }));
    }

    const handleStepToggle = (stepId: string) => {
        setRecord(prev => ({ ...prev, procedureSteps: prev.procedureSteps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) }));
    }

    const handleTagsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const tagsArray = e.target.value.split(',').map(tag => tag.trim());
        setRecord(prev => ({ ...prev, tags: tagsArray }));
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
                                <InputField label="Categoria" name="category" value={record.category} onChange={handleChange} disabled />
                                <InputField label="Data" type="date" name="date" value={record.date} onChange={handleChange} />
                                <InputField label="Profissional" name="professional" value={record.professional || currentUser.fullName || ''} onChange={handleChange} />
                                <InputField label="Hora Início" type="time" name="startTime" value={record.startTime} onChange={handleChange} />
                                <InputField label="Hora Término" type="time" name="endTime" value={record.endTime} onChange={handleChange} />
                                <InputField label="Duração (min)" type="number" name="duration" value={record.duration} onChange={handleChange} />
                                <TextAreaField label="Observações Gerais" name="generalNotes" value={record.generalNotes} onChange={handleChange} className="col-span-2" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'technical' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">Detalhes Técnicos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Técnica Aplicada" name="technique" placeholder="Ex: Fio a Fio, Volume Russo..." value={record.technique} onChange={handleChange} />
                                <SelectField label="Dificuldade Percebida" name="difficulty" value={record.difficulty} onChange={handleChange}>
                                    <option value="">Selecione...</option><option>Fácil</option><option>Médio</option><option>Difícil</option>
                                </SelectField>
                            </div>
                            <div className="mt-4">
                                <CheckboxField label="Houve reação ou sensibilidade?" checked={!!record.reactionDescription} onChange={e => setRecord({ ...record, reactionDescription: e.target.checked ? ' ' : '' })} />
                                {record.reactionDescription && <TextAreaField label="Descreva a reação" name="reactionDescription" value={record.reactionDescription} onChange={handleChange} className="mt-2" />}
                            </div>
                            <div className="mt-4">
                                <InputField label="Tags (separadas por vírgula)" placeholder="Ex: lifting, promocao, primeira vez" value={record.tags.join(', ')} onChange={handleTagsChange} />
                            </div>
                            <h4 className="font-bold text-lg mb-2 mt-4">Materiais, Equipamentos e Etapas</h4>
                            <InputField label="Equipamentos Utilizados" name="equipmentUsed" placeholder="Ex: Radiofrequência Spectra G3, Dermógrafo..." value={record.equipmentUsed} onChange={handleChange} />
                            <div className="my-4">
                                <h5 className="font-semibold mb-2">Etapas Executadas</h5>
                                <div className="space-y-1">
                                    {record.procedureSteps.map(step => <CheckboxField key={step.id} label={step.name} checked={step.done} onChange={() => handleStepToggle(step.id)} />)}
                                </div>
                            </div>
                            <div>
                                <h5 className="font-semibold mb-2">Materiais Utilizados (Custo Total: {record.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</h5>
                                {record.materials.map((mat, index) => (
                                    <div key={mat.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-center">
                                        <input type="text" placeholder="Nome" value={mat.name} onChange={e => handleMaterialChange(index, 'name', e.target.value)} className="col-span-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" />
                                        <input type="text" placeholder="Qtd" value={mat.quantity} onChange={e => handleMaterialChange(index, 'quantity', e.target.value)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" />
                                        <input type="number" placeholder="Custo" value={mat.cost || ''} onChange={e => handleMaterialChange(index, 'cost', parseFloat(e.target.value) || 0)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" />
                                        <input type="text" placeholder="Lote" value={mat.lotNumber || ''} onChange={e => handleMaterialChange(index, 'lotNumber', e.target.value)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" />
                                        <button onClick={() => removeMaterial(index)} className="text-red-500 font-bold text-lg">×</button>
                                    </div>
                                ))}
                                <button onClick={addMaterial} className="text-sm text-blue-500 font-semibold">+ Adicionar Material</button>
                            </div>
                            <TextAreaField label="Observações Técnicas" name="technicalNotes" value={record.technicalNotes} onChange={handleChange} className="mt-4" />
                        </div>
                    )}
                    {activeTab === 'financial' && (
                        <div>
                            <h4 className="font-bold text-lg mb-2">Financeiro</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField label="Valor (R$)" type="number" name="value" value={record.value} onChange={handleChange} />
                                <InputField label="Desconto (R$)" type="number" name="discount" value={record.discount} onChange={handleChange} />
                                <InputField label="Valor Final (R$)" type="number" value={record.finalValue} disabled className="!bg-gray-200 dark:!bg-gray-800" />
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
                                <InputField label="Comissão (%)" type="number" name="commission" value={record.commission} onChange={handleChange} />
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">Satisfação da Cliente</label>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setRecord({ ...record, clientSatisfaction: star })} className={`text-2xl ${star <= record.clientSatisfaction ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>)}
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
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Antes')} className="text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Depois</label>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'Depois')} className="text-sm" />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                {record.media.map(img => (
                                    <div key={img.id} className="relative group">
                                        <img src={img.url} alt={img.type} className="w-full h-auto rounded-lg object-cover" />
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
                            <TextAreaField label="Instruções para a Cliente" name="postProcedureInstructions" value={record.postProcedureInstructions} onChange={handleChange} rows={5} />
                            <div className="mt-4 flex gap-4 items-center">
                                <CheckboxField label="Necessita Retorno?" checked={record.requiresReturn} onChange={e => setRecord({ ...record, requiresReturn: e.target.checked })} />
                                {record.requiresReturn && <InputField label="Data do Retorno" type="date" name="returnDate" value={record.returnDate || ''} onChange={handleChange} />}
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

export default AppointmentRecordModal;
