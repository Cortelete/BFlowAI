import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import type { Client, Procedure, User } from '../../types';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import TextAreaField from '../common/TextAreaField';
import AnamnesisForm from './AnamnesisForm';
import HistoryTab from './HistoryTab';
import { emptyAnamnesisRecord } from '../../services/clientService';

interface ClientDetailsModalProps {
    client: Client;
    procedures: Procedure[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client) => void;
    onDelete: (clientId: string) => void;
    currentUser: User;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, procedures, isOpen, onClose, onSave, onDelete, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'anamnesis' | 'history'>('info');
    const [editableClient, setEditableClient] = useState<Client>(client);

    useEffect(() => {
        setEditableClient(client);
    }, [client]);

    const handleClientChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'tags') {
            setEditableClient(prev => ({ ...prev, tags: value.split(',').map(t => t.trim()) }));
        } else {
            setEditableClient(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAnamnesisChange = (path: string, value: any) => {
        setEditableClient(prev => {
            const keys = path.split('.');
            let current = { ...prev };
            if (!current.anamnesis) current.anamnesis = { ...emptyAnamnesisRecord };
            let obj: any = current.anamnesis;

            for (let i = 0; i < keys.length - 1; i++) {
                obj[keys[i]] = { ...obj[keys[i]] };
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
            return current;
        });
    };

    const handleSaveAndClose = () => {
        onSave(editableClient);
        onClose();
    };

    const totalSpent = useMemo(() => editableClient.appointments.reduce((acc, appt) => acc + (appt.finalValue || appt.price || 0), 0), [editableClient.appointments]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${client.name}`} maxWidth="max-w-6xl">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                    <img src={editableClient.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=8E44AD&color=fff&size=128`} alt={client.name} className="w-24 h-24 rounded-full mx-auto object-cover shadow-lg mb-4" />
                    <h3 className="text-xl font-bold text-center">{editableClient.name}</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">{editableClient.email}</p>
                    <div className="text-center space-y-2 text-sm my-4">
                        <p><strong>Total Gasto:</strong> {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p><strong>Total de Visitas:</strong> {editableClient.appointments.length}</p>
                    </div>
                    <div className="space-y-2">
                        <button onClick={() => setActiveTab('info')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'info' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Informações</button>
                        <button onClick={() => setActiveTab('anamnesis')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'anamnesis' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Anamnese</button>
                        <button onClick={() => setActiveTab('history')} className={`w-full text-left p-2 rounded-lg font-semibold transition-colors ${activeTab === 'history' ? 'bg-brand-pink-100 dark:bg-brand-pink-500/30 text-brand-pink-700 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>Histórico</button>
                    </div>
                    <button onClick={handleSaveAndClose} className="w-full mt-6 bg-brand-pink-500 text-white font-bold py-2 rounded-lg hover:bg-brand-pink-700 transition-colors">Salvar Alterações</button>
                </div>
                <div className="w-full md:w-3/4 max-h-[75vh] overflow-y-auto pr-2">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Informações Pessoais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField label="Nome Completo" name="name" value={editableClient.name} onChange={handleClientChange} />
                                <InputField label="Telefone" name="phone" value={editableClient.phone} onChange={handleClientChange} />
                                <InputField label="E-mail" name="email" value={editableClient.email} onChange={handleClientChange} />
                                <InputField label="Data de Nascimento" type="date" name="birthDate" value={editableClient.birthDate || ''} onChange={handleClientChange} />
                                <InputField label="Profissão" name="profession" value={editableClient.profession || ''} onChange={handleClientChange} />
                                <InputField label="CPF" name="cpf" value={editableClient.cpf || ''} onChange={handleClientChange} />
                                <InputField label="Tags (separadas por vírgula)" name="tags" className="col-span-1 md:col-span-2 lg:col-span-3" value={(editableClient.tags || []).join(', ')} onChange={handleClientChange} />
                            </div>
                            <TextAreaField label="Observações Internas" name="internalNotes" value={editableClient.internalNotes || ''} onChange={handleClientChange} />
                        </div>
                    )}
                    {activeTab === 'anamnesis' && <AnamnesisForm anamnesis={editableClient.anamnesis} onChange={handleAnamnesisChange} />}
                    {activeTab === 'history' && <HistoryTab client={editableClient} setClient={setEditableClient} procedures={procedures} currentUser={currentUser} />}
                </div>
            </div>
        </Modal>
    );
};

export default ClientDetailsModal;
