import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AppRouter from './router';
import { getClients, saveClients } from './services/clientService';
import { getProcedures, saveProcedures } from './services/procedureService';
import * as AuthService from './services/authService';
import type { Client, User, Procedure } from './types';
//teste
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUser());
    const [clients, setClients] = useState<Client[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        AuthService.init();
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setClients(getClients(user.id));
            setProcedures(getProcedures(user.id));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (currentUser) saveClients(currentUser.id, clients);
    }, [clients, currentUser]);

    useEffect(() => {
        if(currentUser) saveProcedures(currentUser.id, procedures);
    }, [procedures, currentUser]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setClients(getClients(user.id));
        setProcedures(getProcedures(user.id));
        toast.success(`Bem-vindo(a) de volta, ${user.username}!`);
    };

    const handleLogout = () => {
        AuthService.logout();
        setCurrentUser(null);
        setClients([]);
        setProcedures([]);
        toast.success('Você saiu com sucesso!');
    };
    
    const handleUserUpdate = (user: User) => setCurrentUser(user);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-200 dark:bg-gray-900"></div>;
    }

    return (
        <>
            <Toaster position="top-center" reverseOrder={false} />
            <AppRouter 
                currentUser={currentUser}
                clients={clients}
                setClients={setClients}
                procedures={procedures}
                setProcedures={setProcedures}
                theme={theme}
                toggleTheme={toggleTheme}
                handleLoginSuccess={handleLoginSuccess}
                handleLogout={handleLogout}
                handleUserUpdate={handleUserUpdate}
            />
        </>
    );
};

export default App;