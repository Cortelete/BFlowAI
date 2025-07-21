import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AppRouter from './router';
import { getClients, saveClients } from './services/clientService';
import { getProcedures, saveProcedures } from './services/procedureService';
import * as AuthService from './services/authService';
import type { Client, User, Procedure } from './types';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isLoading, setIsLoading] = useState(true);
    
    // Initial data load effect
    useEffect(() => {
        const loadInitialData = async () => {
            await AuthService.init();
            const user = AuthService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
                // Fetch data in parallel for efficiency
                const [clientData, procedureData] = await Promise.all([
                    getClients(user.id),
                    getProcedures(user.id)
                ]);
                setClients(clientData);
                setProcedures(procedureData);
            }
            setIsLoading(false);
        };

        loadInitialData();
    }, []);

    // Effect to save clients when they change
    useEffect(() => {
        // We don't save during the initial load to avoid overwriting anything.
        // We also check for a current user to associate the data with.
        if (!isLoading && currentUser) {
            saveClients(currentUser.id, clients);
        }
    }, [clients, currentUser, isLoading]);

    // Effect to save procedures when they change
    useEffect(() => {
        if (!isLoading && currentUser) {
            saveProcedures(currentUser.id, procedures);
        }
    }, [procedures, currentUser, isLoading]);

    // Theme management effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    const handleLoginSuccess = async (user: User) => {
        setCurrentUser(user);
        const [clientData, procedureData] = await Promise.all([
            getClients(user.id),
            getProcedures(user.id)
        ]);
        setClients(clientData);
        setProcedures(procedureData);
        toast.success(`Bem-vindo(a) de volta, ${user.username}!`);
    };

    const handleLogout = async () => {
        await AuthService.logout();
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