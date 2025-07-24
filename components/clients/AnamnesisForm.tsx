import React, { ChangeEvent } from 'react';
import type { AnamnesisRecord, AnamnesisHealthHistory, AnamnesisAllergies } from '../../types';
import InputField from '../common/InputField';
import TextAreaField from '../common/TextAreaField';
import SelectField from '../common/SelectField';
import CheckboxField from '../common/CheckboxField';

interface AnamnesisFormProps {
    anamnesis: AnamnesisRecord;
    onChange: (path: string, value: any) => void;
}

const AnamnesisForm: React.FC<AnamnesisFormProps> = ({ anamnesis, onChange }) => {
    const handleCheckboxChange = (path: string) => (e: ChangeEvent<HTMLInputElement>) => onChange(path, e.target.checked);
    const handleValueChange = (path: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(path, e.target.value);
    
    const healthHistoryLabels: { [key in keyof AnamnesisHealthHistory]: string } = {
        hypertension: 'Hipertensão', diabetes: 'Diabetes', hormonalDisorders: 'Distúrbios Hormonais',
        epilepsy: 'Epilepsia', heartDisease: 'Doença Cardíaca', autoimmuneDisease: 'Doença Autoimune',
        respiratoryProblems: 'Problemas Respiratórios', respiratoryAllergies: 'Alergias Respiratórias',
        cancer: 'Câncer', pacemaker: 'Marcapasso', skinDisease: 'Doença de Pele',
        keloids: 'Queloides', hepatitis: 'Hepatite', hiv: 'HIV', otherConditions: 'Outras Condições',
    };
    
    const allergyLabels: { [key in keyof AnamnesisAllergies]: string } = {
        alcohol: 'Álcool', latex: 'Látex', cosmetics: 'Cosméticos', localAnesthetics: 'Anestésicos Locais',
        lashGlue: 'Cola de Cílios', makeup: 'Maquiagem', henna: 'Henna', otherAllergies: 'Outras Alergias',
    };

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-xl border-b pb-2">Ficha de Anamnese Completa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <fieldset className="space-y-2 p-4 border rounded-lg">
                    <legend className="font-semibold text-lg mb-2">Histórico de Saúde</legend>
                    {Object.entries(anamnesis.healthHistory).filter(([key]) => key !== 'otherConditions').map(([key, value]) => (
                        <CheckboxField key={key} label={healthHistoryLabels[key as keyof AnamnesisHealthHistory]} checked={value as boolean} onChange={handleCheckboxChange(`healthHistory.${key}`)} />
                    ))}
                    <TextAreaField label={healthHistoryLabels.otherConditions} value={anamnesis.healthHistory.otherConditions} onChange={handleValueChange('healthHistory.otherConditions')} />
                </fieldset>
                
                <fieldset className="space-y-2 p-4 border rounded-lg">
                    <legend className="font-semibold text-lg mb-2">Alergias</legend>
                     {Object.entries(anamnesis.allergies).filter(([key]) => key !== 'otherAllergies').map(([key, value]) => (
                        <CheckboxField key={key} label={allergyLabels[key as keyof AnamnesisAllergies]} checked={value as boolean} onChange={handleCheckboxChange(`allergies.${key}`)} />
                    ))}
                    <TextAreaField label={allergyLabels.otherAllergies} value={anamnesis.allergies.otherAllergies} onChange={handleValueChange('allergies.otherAllergies')} />
                </fieldset>

                <fieldset className="col-span-1 md:col-span-2 space-y-2 p-4 border rounded-lg">
                    <legend className="font-semibold text-lg mb-2">Medicações e Tratamentos</legend>
                    <TextAreaField label="Medicações em uso" value={anamnesis.medications.currentMedications} onChange={handleValueChange('medications.currentMedications')} />
                    <div className="flex gap-6">
                         <CheckboxField label="Usa/usou Roacutan nos últimos 12 meses?" checked={anamnesis.medications.roaccutane} onChange={handleCheckboxChange('medications.roaccutane')} />
                         <CheckboxField label="Usa anticoncepcional?" checked={anamnesis.medications.contraceptive} onChange={handleCheckboxChange('medications.contraceptive')} />
                    </div>
                </fieldset>
                
                <fieldset className="col-span-1 md:col-span-2 space-y-4 p-4 border rounded-lg">
                    <legend className="font-semibold text-lg mb-2">Histórico Estético</legend>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">Extensão de Cílios</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <CheckboxField label="Já fez extensão antes?" checked={anamnesis.aestheticHistory.lashExtensions.hasDoneBefore} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.hasDoneBefore')} />
                            <CheckboxField label="Teve reação?" checked={anamnesis.aestheticHistory.lashExtensions.hadReaction} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.hadReaction')} />
                            <TextAreaField label="Descrição da reação" value={anamnesis.aestheticHistory.lashExtensions.reactionDescription} onChange={handleValueChange('aestheticHistory.lashExtensions.reactionDescription')} className="col-span-2"/>
                             <CheckboxField label="Usa lentes de contato?" checked={anamnesis.aestheticHistory.lashExtensions.wearsContacts} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.wearsContacts')} />
                            <CheckboxField label="Usa colírios?" checked={anamnesis.aestheticHistory.lashExtensions.usesEyeDrops} onChange={handleCheckboxChange('aestheticHistory.lashExtensions.usesEyeDrops')} />
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">Design de Sobrancelhas</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <CheckboxField label="Já usou henna/tintura?" checked={anamnesis.aestheticHistory.browDesign.usedHenna} onChange={handleCheckboxChange('aestheticHistory.browDesign.usedHenna')} />
                            <CheckboxField label="Possui falhas ou cicatrizes?" checked={anamnesis.aestheticHistory.browDesign.hasScars} onChange={handleCheckboxChange('aestheticHistory.browDesign.hasScars')} />
                             <TextAreaField label="Reações alérgicas" value={anamnesis.aestheticHistory.browDesign.allergicReactions} onChange={handleValueChange('aestheticHistory.browDesign.allergicReactions')} className="col-span-2"/>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">Cuidados com a Pele</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <SelectField label="Tipo de pele" value={anamnesis.aestheticHistory.skinCare.skinType} onChange={handleValueChange('aestheticHistory.skinCare.skinType')}>
                                <option value="">Não informado</option>
                                <option>Oleosa</option><option>Seca</option><option>Mista</option><option>Sensível</option><option>Acneica</option>
                            </SelectField>
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                               <CheckboxField label="Usa ácidos/peelings?" checked={anamnesis.aestheticHistory.skinCare.usesAcids} onChange={handleCheckboxChange('aestheticHistory.skinCare.usesAcids')} />
                               <CheckboxField label="Já fez microagulhamento?" checked={anamnesis.aestheticHistory.skinCare.hadNeedling} onChange={handleCheckboxChange('aestheticHistory.skinCare.hadNeedling')} />
                               <CheckboxField label="Fez procedimentos recentes?" checked={anamnesis.aestheticHistory.skinCare.recentProcedures} onChange={handleCheckboxChange('aestheticHistory.skinCare.recentProcedures')} />
                            </div>
                        </div>
                    </div>
                </fieldset>

                 <fieldset className="col-span-1 md:col-span-2 space-y-2 p-4 border rounded-lg">
                    <legend className="font-semibold text-lg mb-2">Rotina e Consentimento</legend>
                    <CheckboxField label="Usa protetor solar diariamente?" checked={anamnesis.careRoutine.usesSunscreen} onChange={handleCheckboxChange('careRoutine.usesSunscreen')} />
                    <TextAreaField label="Produtos em uso" value={anamnesis.careRoutine.currentProducts} onChange={handleValueChange('careRoutine.currentProducts')} />
                    <TextAreaField label="Anotações da Profissional" value={anamnesis.professionalNotes} onChange={handleValueChange('professionalNotes')} />
                     <CheckboxField label="Declaro que as informações são verdadeiras" checked={anamnesis.declaration} onChange={handleCheckboxChange('declaration')} />
                    <CheckboxField label="Autorizo uso de imagem" checked={anamnesis.imageAuth} onChange={handleCheckboxChange('imageAuth')} />
                </fieldset>
            </div>
        </div>
    )
}

export default AnamnesisForm;
