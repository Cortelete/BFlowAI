import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import type { User } from '../../types';
import { Icon } from '../common/Icon';
import { EditableText } from '../EditableText';
import FloatingMenu from './FloatingMenu';
import Mascot from './Mascot';
import Stardust from './Stardust';

// Main application layout, including header, navigation, and footer.
const AppLayout: React.FC<{ currentUser: User; handleLogout: () => void; toggleTheme: () => void; theme: string; }> = ({ currentUser, handleLogout, toggleTheme, theme }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const baseNavItems = [
        { path: '/', label: 'Dashboard', icon: 'dashboard' },
        { path: '/clients', label: 'Clientes', icon: 'clients' },
        { path: '/schedule', label: 'Agenda', icon: 'calendar'},
        { path: '/procedures', label: 'Procedimentos', icon: 'clipboard' },
        { path: '/communication', label: 'Comunicação', icon: 'communication' },
        { path: '/financials', label: 'Financeiro', icon: 'dollar-sign' },
        { path: '/ideas', label: 'Ideias', icon: 'idea' },
    ];

    const navItems = [...baseNavItems];
    if (currentUser.userType === 'Administrador' || currentUser.isBoss) {
        navItems.push({ path: '/users', label: 'Usuários', icon: 'users' });
    }
    
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    useEffect(() => {
        // Close mobile menu on route change
        setIsMobileMenuOpen(false);
    }, [location.pathname]);
    
    useEffect(() => {
        // Lock body scroll when mobile menu is open
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
        
        const handleEsc = (e: KeyboardEvent) => {
            if(e.key === 'Escape') setIsMobileMenuOpen(false);
        }
        
        if (isMobileMenuOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isMobileMenuOpen]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-pink-100 via-brand-purple-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-500">
            <Stardust />
            <header className="bg-white/30 dark:bg-black/20 backdrop-blur-lg sticky top-0 z-30 shadow-md">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <button onClick={() => navigate('/')} className="text-left text-2xl md:text-3xl font-bold font-serif text-brand-pink-500 dark:text-brand-pink-300">
                         <EditableText textKey="app_title" defaultValue="BeautyFlow AI ✨" isBoss={currentUser.isBoss || false} />
                    </button>
                    <nav className="hidden md:flex items-center space-x-1 bg-white/30 dark:bg-black/30 p-1 rounded-full">
                        {navItems.map(item => {
                             const isActive = location.pathname === item.path;
                             const className = `px-3 py-2 rounded-full transition-all duration-300 font-semibold text-sm flex items-center gap-2 ${isActive ? 'bg-white dark:bg-gray-900 shadow-md text-brand-pink-500 dark:text-brand-pink-300' : 'hover:bg-white/50 dark:hover:bg-black/50'}`;
                             return (
                                <Link key={item.path} to={item.path} title={item.label} className={className}>
                                   <Icon icon={item.icon} className="h-4 w-4" />
                                   <span className="hidden lg:inline">{item.label}</span>
                                </Link>
                             );
                        })}
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/profile')}
                            className={`p-2 rounded-full transition-colors ${location.pathname === '/profile' ? 'bg-white dark:bg-gray-900' : 'bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50'}`}>
                            <Icon icon="profile" className="text-brand-purple-700 dark:text-brand-purple-300"/>
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                            <Icon icon={theme === 'light' ? 'moon' : 'sun'} className="text-brand-gold-500"/>
                        </button>
                         <button onClick={handleLogout} className="p-2 rounded-full bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50 transition-colors">
                            <Icon icon="logout" className="text-red-500"/>
                        </button>
                        <div className="md:hidden ml-2">
                             <button onClick={toggleMobileMenu} className="relative z-50 h-6 w-6" aria-label="Abrir menu" aria-expanded={isMobileMenuOpen}>
                                <span className={`block absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-2'}`}></span>
                                <span className={`block absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`block absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-2'}`}></span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
             <div 
                role="dialog" 
                aria-modal="true" 
                className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
                <nav className={`fixed top-0 left-0 h-full w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl z-50 p-6 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                     <button onClick={() => navigate('/')} className="text-left text-2xl font-bold font-serif text-brand-pink-500 dark:text-brand-pink-300 mb-8">
                         <EditableText textKey="app_title" defaultValue="BeautyFlow AI ✨" isBoss={currentUser.isBoss || false} />
                    </button>
                    <div className="space-y-2">
                        {navItems.map(item => {
                             const isActive = location.pathname === item.path;
                             return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 p-3 rounded-lg text-lg font-semibold transition-colors ${isActive ? 'bg-brand-pink-100 dark:bg-brand-pink-700/50 text-brand-pink-700 dark:text-white' : 'hover:bg-black/5'}`}
                                >
                                   <Icon icon={item.icon} className="h-6 w-6 text-brand-purple-500" />
                                   <span>{item.label}</span>
                                </Link>
                             );
                        })}
                    </div>
                    <div className="mt-auto text-center text-sm">
                        <p>Logado como <span className="font-bold">{currentUser.displayName || currentUser.username}</span></p>
                    </div>
                </nav>
            </div>

            <main className="container mx-auto">
                <Outlet /> {/* Child routes will render here */}
            </main>
            
            <footer className="bg-white/30 dark:bg-black/20 backdrop-blur-lg text-center p-4 mt-8">
                <p className="text-sm opacity-70">&copy; {new Date().getFullYear()} BeautyFlow AI. Todos os direitos reservados ao Luxury Studio de Beleza Joyci Almeida.</p>
            </footer>
            
            <Mascot />
            <FloatingMenu navItems={navItems} />
        </div>
    );
};

export default AppLayout;
