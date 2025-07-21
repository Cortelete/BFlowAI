import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import * as AuthService from '../services/authService';
import type { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  
  // State for login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for registration form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }
    const toastId = toast.loading('Entrando...');
    try {
      const user = await AuthService.login(loginUsername, loginPassword);
      toast.dismiss(toastId);
      onLoginSuccess(user);
    } catch (error) {
      toast.error(String(error), { id: toastId });
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regConfirmPassword) {
        toast.error("Por favor, preencha todos os campos.");
        return;
    }
    if (regPassword !== regConfirmPassword) {
        toast.error("As senhas não coincidem.");
        return;
    }
     const toastId = toast.loading('Criando conta...');
    try {
        await AuthService.register(regUsername, regPassword);
        toast.success('Conta criada com sucesso! Por favor, faça o login.', { id: toastId });
        setIsLoginView(true); // Switch to login view after successful registration
        setLoginUsername(regUsername);
        setLoginPassword('');
    } catch(error) {
        toast.error(String(error), { id: toastId });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-pink-100 via-brand-purple-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md bg-white/50 dark:bg-black/30 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transform transition-all duration-500">
        <h1 className="text-4xl font-bold font-serif text-center text-brand-pink-500 dark:text-brand-pink-300 mb-2">
          BeautyFlow AI ✨
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            {isLoginView ? 'Bem-vinda de volta!' : 'Crie sua conta para começar'}
        </p>

        {isLoginView ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Usuário</label>
              <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Senha</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            </div>
            <button type="submit" className="w-full bg-brand-pink-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-pink-700 transition-all duration-300 transform hover:scale-105">
              Entrar
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Usuário</label>
              <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                placeholder="Escolha um nome de usuário"
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Senha</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Crie uma senha forte"
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">Confirmar Senha</label>
              <input type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                className="w-full p-3 bg-white/20 dark:bg-black/30 border border-gray-300/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink-300 transition-all text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
            </div>
            <button type="submit" className="w-full bg-brand-purple-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-brand-purple-700 transition-all duration-300 transform hover:scale-105">
              Criar Conta
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-brand-purple-700 dark:text-brand-purple-300 font-semibold hover:underline">
                {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça o login'}
            </button>
        </div>
      </div>
    </div>
  );
};
