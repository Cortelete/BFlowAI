import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Client, User, Procedure, Expense } from '../types';
import AppLayout from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { Clients } from '../pages/Clients';
import { Communication } from '../pages/Communication';
import { Ideas } from '../pages/Ideas';
import { Login } from '../pages/Login';
import { Profile } from '../pages/Profile';
import { Procedures } from '../pages/Procedures';
import { Financials } from '../pages/Financials';
import { Scheduling } from '../pages/Scheduling';
import { Atendimento } from '../pages/Atendimento';
import { Users } from '../pages/Users';
import Page from '../components/common/Page';

interface AppRouterProps {
    currentUser: User | null;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    procedures: Procedure[];
    setProcedures: React.Dispatch<React.SetStateAction<Procedure[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    theme: string;
    toggleTheme: () => void;
    handleLoginSuccess: (user: User) => void;
    handleLogout: () => void;
    handleUserUpdate: (user: User) => void;
}

const AppRouter: React.FC<AppRouterProps> = (props) => {
    const { 
        currentUser, 
        clients, 
        setClients, 
        procedures, 
        setProcedures,
        expenses,
        setExpenses,
        theme, 
        toggleTheme, 
        handleLoginSuccess, 
        handleLogout, 
        handleUserUpdate 
    } = props;

    return (
        <HashRouter>
            <Routes>
                {currentUser ? (
                    <Route element={<AppLayout currentUser={currentUser} handleLogout={handleLogout} toggleTheme={toggleTheme} theme={theme} />}>
                        <Route path="/" element={<Page title="Dashboard"><Dashboard clients={clients} isBoss={currentUser.isBoss || false} /></Page>} />
                        <Route path="/clients" element={<Page title="Clientes"><Clients clients={clients} setClients={setClients} procedures={procedures} currentUser={currentUser} /></Page>} />
                        <Route path="/schedule" element={<Page title="Agenda"><Scheduling clients={clients} setClients={setClients} procedures={procedures} currentUser={currentUser} /></Page>} />
                        <Route path="/atendimento/:clientId/:appointmentId" element={<Page title="Atendimento"><Atendimento allClients={clients} setClients={setClients} currentUser={currentUser} procedures={procedures} /></Page>} />
                        <Route path="/procedures" element={<Page title="Procedimentos"><Procedures procedures={procedures} setProcedures={setProcedures} currentUser={currentUser} /></Page>} />
                        <Route path="/communication" element={<Page title="Comunicação"><Communication clients={clients} currentUser={currentUser} /></Page>} />
                        <Route path="/financials" element={<Page title="Financeiro"><Financials clients={clients} expenses={expenses} setExpenses={setExpenses} currentUser={currentUser} /></Page>} />
                        <Route path="/ideas" element={<Page title="Ideias"><Ideas currentUser={currentUser} /></Page>} />
                        <Route path="/profile" element={<Page title="Perfil"><Profile user={currentUser} onUserUpdate={handleUserUpdate} /></Page>} />
                        <Route path="/users" element={<Page title="Usuários"><Users currentUser={currentUser} /></Page>} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                ) : (
                     <Route path="*" element={<Page title="Login"><Login onLoginSuccess={handleLoginSuccess} /></Page>} />
                )}
            </Routes>
        </HashRouter>
    );
};

export default AppRouter;