import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User } from '../types';
import * as AuthService from '../services/authService';
import { toast } from 'react-hot-toast';
import { Icon } from '../components/Icons';

interface ProfileProps {
    user: User;
    onUserUpdate: (user: User) => void;
}

const ProfileInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <input {...props} className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
);

const ProfileSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
     <div>
        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
        <select {...props} className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
            {children}
        </select>
    </div>
);

export const Profile: React.FC<ProfileProps> = ({ user, onUserUpdate }) => {
    const [profileData, setProfileData] = useState<User>(user);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Keep profileData in sync if the user prop changes from above
    useEffect(() => {
        setProfileData(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfileData(prev => ({ ...prev, photo: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const calculateAge = useMemo(() => {
        if (!profileData.birthDate) return null;
        try {
            const birthDate = new Date(profileData.birthDate);
            // Check if date is valid
            if(isNaN(birthDate.getTime())) return null;
            const ageDifMs = Date.now() - birthDate.getTime();
            const ageDate = new Date(ageDifMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970);
        } catch(e) {
            return null;
        }
    }, [profileData.birthDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword && newPassword !== confirmPassword) {
            toast.error("As novas senhas não coincidem.");
            return;
        }

        const updates: Partial<User> = { ...profileData };
        // Don't send an empty password update
        if (newPassword) {
            updates.password = newPassword;
        } else {
            delete updates.password;
        }

        const toastId = toast.loading("Atualizando perfil...");
        try {
            const updatedUser = await AuthService.updateUser(user.id, updates);
            onUserUpdate(updatedUser);
            toast.success("Perfil atualizado com sucesso!", { id: toastId });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(String(error), { id: toastId });
        }
    };

    return (
        <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                     <h2 className="text-3xl font-bold font-serif text-gray-800 dark:text-white">Meu Perfil</h2>
                     <button
                        type="submit"
                        className="bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105 w-full md:w-auto"
                    >
                        Salvar Alterações
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Profile Pic & Bio */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg text-center">
                            <div
                                className="relative w-32 h-32 mx-auto rounded-full mb-4 group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Alterar foto de perfil"
                                role="button"
                            >
                                <img
                                    src={profileData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || profileData.username)}&background=8E44AD&color=fff&size=128`}
                                    alt="Foto de Perfil"
                                    className="w-full h-full rounded-full object-cover shadow-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="camera" className="text-white h-8 w-8" />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePhotoUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <h3 className="text-xl font-bold">{profileData.fullName || profileData.username}</h3>
                            <p className="text-sm text-brand-purple-500 dark:text-brand-purple-300">{profileData.userType}</p>
                            
                            <textarea
                                name="bio"
                                placeholder="Mini bio / Descrição do profissional"
                                value={profileData.bio || ''}
                                onChange={handleChange}
                                rows={3}
                                className="mt-4 w-full p-2 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-sm"
                            ></textarea>
                        </div>
                    </div>
                    
                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold font-serif mb-4">Informações Básicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <ProfileInput label="Nome de Login (Usuário)" name="username" value={profileData.username || ''} onChange={handleChange} disabled={!user.isBoss} title={user.isBoss ? "Como administrador, você pode editar o nome de usuário." : "O nome de usuário não pode ser alterado."} />
                               <ProfileInput label="Nome Completo" name="fullName" value={profileData.fullName || ''} onChange={handleChange} />
                               <ProfileInput label="Apelido / Nome Social" name="displayName" value={profileData.displayName || ''} onChange={handleChange} />
                               <ProfileSelect label="Tipo de Usuário" name="userType" value={profileData.userType} onChange={handleChange} disabled={!user.isBoss}>
                                  <option>Administrador</option>
                                  <option>Funcionário</option>
                                  <option>Secretaria</option>
                                  <option>Profissional Lash</option>
                                  <option>Cliente</option>
                               </ProfileSelect>
                               <ProfileSelect label="Gênero" name="gender" value={profileData.gender} onChange={handleChange}>
                                  <option>Prefiro não dizer</option>
                                  <option>Feminino</option>
                                  <option>Masculino</option>
                                  <option>Não Binário</option>
                               </ProfileSelect>
                               <div>
                                    <ProfileInput type="date" label="Data de Nascimento" name="birthDate" value={profileData.birthDate || ''} onChange={handleChange} />
                                    {calculateAge !== null && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Idade: {calculateAge} anos</p>}
                               </div>
                               <ProfileInput label="CPF" name="cpf" value={profileData.cpf || ''} onChange={handleChange} />
                               <ProfileInput label="RG" name="rg" value={profileData.rg || ''} onChange={handleChange} />
                            </div>
                        </div>

                         <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold font-serif mb-4">Informações Profissionais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <ProfileInput label="Cargo ou Função" name="role" value={profileData.role || ''} onChange={handleChange} />
                               <ProfileInput label="Especialidade" name="specialty" value={profileData.specialty || ''} onChange={handleChange} />
                            </div>
                        </div>
                        
                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold font-serif mb-4">Contato e Redes Sociais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ProfileInput type="email" label="E-mail Principal" name="email" value={profileData.email || ''} onChange={handleChange} />
                                <ProfileInput type="email" label="E-mail Alternativo" name="altEmail" value={profileData.altEmail || ''} onChange={handleChange} />
                                <ProfileInput type="tel" label="Telefone Celular" name="phone" value={profileData.phone || ''} onChange={handleChange} />
                                <ProfileInput type="tel" label="Telefone Fixo" name="fixedPhone" value={profileData.fixedPhone || ''} onChange={handleChange} />
                                <ProfileInput label="WhatsApp" name="whatsapp" value={profileData.whatsapp || ''} onChange={handleChange} placeholder="5542999998888" />
                                <ProfileInput label="Instagram" name="instagram" value={profileData.instagram || ''} onChange={handleChange} placeholder="@seu_usuario" />
                                <ProfileInput label="Facebook" name="facebook" value={profileData.facebook || ''} onChange={handleChange} />
                                <ProfileInput label="LinkedIn" name="linkedin" value={profileData.linkedin || ''} onChange={handleChange} />
                                <ProfileInput label="TikTok" name="tiktok" value={profileData.tiktok || ''} onChange={handleChange} />
                            </div>
                        </div>
                        
                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold font-serif mb-4">Endereço</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ProfileInput label="CEP" name="cep" value={profileData.cep || ''} onChange={handleChange} className="md:col-span-1"/>
                                <ProfileInput label="Rua" name="street" value={profileData.street || ''} onChange={handleChange} className="md:col-span-2"/>
                                <ProfileInput label="Número" name="number" value={profileData.number || ''} onChange={handleChange} />
                                <ProfileInput label="Complemento" name="complement" value={profileData.complement || ''} onChange={handleChange} className="md:col-span-2"/>
                                <ProfileInput label="Bairro" name="neighborhood" value={profileData.neighborhood || ''} onChange={handleChange} />
                                <ProfileInput label="Cidade" name="city" value={profileData.city || ''} onChange={handleChange} />
                                <ProfileInput label="Estado" name="state" value={profileData.state || ''} onChange={handleChange} />
                             </div>
                        </div>

                        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold font-serif mb-4">Segurança</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ProfileInput type="password" label="Nova Senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Deixe em branco para não alterar" />
                                <ProfileInput type="password" label="Confirmar Nova Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a nova senha" />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};