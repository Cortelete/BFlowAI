import React from 'react';
import type { Procedure } from '../../types';
import Modal from '../common/Modal';
import InputField from '../common/InputField';
import TextAreaField from '../common/TextAreaField';
import SelectField from '../common/SelectField';

interface ProcedureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    currentProcedure: Procedure | Omit<Procedure, 'id'>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const ProcedureModal: React.FC<ProcedureModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isEditing,
    currentProcedure,
    handleInputChange
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Procedimento" : "Adicionar Novo Procedimento"}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">Informações Gerais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Título do Procedimento" name="name" value={currentProcedure.name} onChange={handleInputChange} />
                    <SelectField label="Categoria" name="category" value={currentProcedure.category} onChange={handleInputChange}>
                        <option>Geral</option>
                        <option>Lash Design</option>
                        <option>Sobrancelha</option>
                        <option>Limpeza de Pele</option>
                        <option>Radiofrequência</option>
                        <option>Corporal</option>
                    </SelectField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Preço Padrão (R$)" type="number" name="defaultPrice" value={currentProcedure.defaultPrice || ''} onChange={handleInputChange} />
                    <InputField label="Custo Padrão (R$)" type="number" name="defaultCost" value={currentProcedure.defaultCost || ''} onChange={handleInputChange} />
                    <InputField label="Duração Padrão (min)" type="number" name="defaultDuration" value={currentProcedure.defaultDuration || ''} onChange={handleInputChange} />
                </div>
                <h4 className="font-bold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">Descrições Padrão</h4>
                <TextAreaField label="Descrição Técnica" name="technicalDescription" placeholder="Ex: Fio a Fio, Volume Híbrido, Dermaplaning, etc." value={currentProcedure.technicalDescription} onChange={handleInputChange} />
                <TextAreaField label="Cuidados Pós-Procedimento" name="defaultPostProcedureInstructions" placeholder="Ex: Não molhar por 24h, usar protetor solar..." value={currentProcedure.defaultPostProcedureInstructions} onChange={handleInputChange} />
                <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" id="isActive" name="isActive" checked={(currentProcedure as Procedure).isActive} onChange={handleInputChange} className="h-4 w-4 rounded text-brand-pink-500 focus:ring-brand-pink-500" />
                    <label htmlFor="isActive" className="font-semibold">Procedimento ativo no catálogo</label>
                </div>
                <button onClick={onSave} className="w-full bg-brand-pink-500 text-white font-bold py-3 rounded-lg hover:bg-brand-pink-700 transition-colors mt-6">
                    {isEditing ? "Salvar Alterações" : "Adicionar Procedimento"}
                </button>
            </div>
        </Modal>
    );
};

export default ProcedureModal;
