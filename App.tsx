import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AppRouter from './router';
import { getClients, saveClients } from './services/clientService';
import { getProcedures, saveProcedures } from './services/procedureService';
import { getExpenses, saveExpenses } from './services/financialService';
import * as AuthService from './services/authService';
import type { Client, User, Procedure, Expense } from './types';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isLoading, setIsLoading] = useState(true);
    
    // Helper to load all data for a user
    const loadUserData = async (user: User) => {
        let clientData: Client[] = [];
        // Admins get to see all clients from all users
        if (user.userType === 'Administrador' || user.isBoss) {
            const allUsers = await AuthService.getAllUsers();
            const allClientPromises = allUsers.map(u => getClients(u.id));
            const allClientsArrays = await Promise.all(allClientPromises);
            
            // Flatten the array of arrays and remove duplicates by ID
            const clientMap = new Map<string, Client>();
            allClientsArrays.flat().forEach(client => {
                if (!clientMap.has(client.id)) {
                    clientMap.set(client.id, client);
                }
            });
            clientData = Array.from(clientMap.values());
        } else {
            // Regular users see only their own clients
            clientData = await getClients(user.id);
        }

        const [procedureData, expenseData] = await Promise.all([
            getProcedures(user.id),
            getExpenses(user.id)
        ]);

        setClients(clientData);
        setProcedures(procedureData);
        setExpenses(expenseData);
    };

    // Initial data load effect
    useEffect(() => {
        const loadInitialData = async () => {
            await AuthService.init();
            const user = AuthService.getCurrentUser();
            if (user) {
                setCurrentUser(user);
                await loadUserData(user);
            }
            setIsLoading(false);
        };

        loadInitialData();
    }, []);

    // Effect to save clients when they change
    useEffect(() => {
        if (!isLoading && currentUser) {
            // Save logic needs to be per-user. The global view for admins is read-only in a sense.
            // When an admin edits a client, that save needs to go to the correct user's storage.
            // This is handled within the component logic (e.g., ClientDetailsModal).
            // For simplicity, we won't try to auto-save the aggregated list.
            if (currentUser.userType !== 'Administrador' && !currentUser.isBoss) {
                 saveClients(currentUser.id, clients);
            }
        }
    }, [clients, currentUser, isLoading]);

    // Effect to save procedures when they change
    useEffect(() => {
        if (!isLoading && currentUser) {
            saveProcedures(currentUser.id, procedures);
        }
    }, [procedures, currentUser, isLoading]);

    // Effect to save expenses when they change
    useEffect(() => {
        if (!isLoading && currentUser) {
            saveExpenses(currentUser.id, expenses);
        }
    }, [expenses, currentUser, isLoading]);

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
        await loadUserData(user);
        toast.success(`Bem-vindo(a) de volta, ${user.displayName || user.username}!`);
    };

    const handleLogout = async () => {
        await AuthService.logout();
        setCurrentUser(null);
        setClients([]);
        setProcedures([]);
        setExpenses([]);
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
                expenses={expenses}
                setExpenses={setExpenses}
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