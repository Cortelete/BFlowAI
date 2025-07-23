import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { EditableText } from './EditableText';
import FloatingMenu from './FloatingMenu';
import { generateMascotTip } from '../services/geminiService';
import type { User } from '../types';

// A visual effect component that leaves a 'stardust' trail behind the mouse cursor.
const Stardust: React.FC = () => {
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const star = document.createElement('div');
            star.style.position = 'fixed';
            star.style.left = `${e.clientX}px`;
            star.style.top = `${e.clientY}px`;
            // Increased size and focused purple/violet color range for a more 'brilliant' effect.
            star.style.width = `${Math.random() * 8 + 4}px`;
            star.style.height = star.style.width;
            star.style.borderRadius = '50%';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.backgroundColor = `hsl(${Math.random() * 40 + 250}, 100%, 80%)`;
            star.style.filter = 'blur(1.5px)';
            document.body.appendChild(star);

            star.animate([
                { transform: 'scale(1) translate(0, 0)', opacity: 1 },
                { transform: `scale(${Math.random()}) translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px)`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 1000,
                easing: 'cubic-bezier(0.1, 0.7, 1.0, 0.1)',
            }).onfinish = () => star.remove();
        };

        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, []);

    return null;
};

// An interactive mascot whose eyes follow the mouse cursor and gives AI tips.
const Mascot: React.FC = () => {
    const mascotRef = useRef<HTMLDivElement>(null);
    const [eyeStyle, setEyeStyle] = useState({});
    const [tip, setTip] = useState("Olá! Clique em mim para uma dica.");
    const [showTip, setShowTip] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTip = useCallback(() => {
        if (isLoading) {
            return;
        }
        
        setIsLoading(true);
        setTip("Pensando...");
        setShowTip(true);

        generateMascotTip().then(newTip => {
            setTip(newTip);
        }).catch(() => {
            setTip("Oops! Tive um probleminha. Tente novamente!");
        }).finally(() => {
            setIsLoading(false);
        });
    }, [isLoading]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const mascot = document.getElementById('mascot');
            if (!mascot) return;

            const rect = mascot.getBoundingClientRect();
            const anchorX = rect.left + rect.width / 2;
            const anchorY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - anchorY, e.clientX - anchorX);
            const distance = Math.min(6, Math.hypot(e.clientX - anchorX, e.clientY - anchorY) / 20);
            const eyeX = Math.cos(angle) * distance;
            const eyeY = Math.sin(angle) * distance;
            
            setEyeStyle({ transform: `translate(${eyeX}px, ${eyeY}px)` });
        };

        window.addEventListener('mousemove', onMouseMove);
        return () => window.removeEventListener('mousemove', onMouseMove);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mascotRef.current && !mascotRef.current.contains(event.target as Node)) {
                setShowTip(false);
            }
        };

        if (showTip) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTip]); 


    return (
        <div id="mascot" ref={mascotRef} className="fixed bottom-4 left-4 w-24 h-24 z-40 group cursor-pointer" onClick={fetchTip}>
            <div className="absolute inset-0 bg-brand-purple-300 dark:bg-brand-purple-700 rounded-full animate-pulse opacity-20"></div>
            <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-pink-300 to-brand-purple-300 dark:from-brand-pink-500 dark:to-brand-purple-500 rounded-full shadow-lg"></div>
                <div className="absolute top-1/2 -translate-y-1/2 flex gap-3">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-inner"><div className="w-3 h-3 bg-gray-800 rounded-full" style={eyeStyle}></div></div>
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-inner"><div className="w-3 h-3 bg-gray-800 rounded-full" style={eyeStyle}></div></div>
                </div>
            </div>
             <div className={`absolute bottom-0 left-full ml-4 w-56 bg-white dark:bg-gray-800 text-gray-700 dark:text-white text-sm rounded-lg p-3 shadow-xl whitespace-normal transition-all duration-500 ${showTip ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                <span className="font-bold text-brand-purple-500">Dica da IA:</span> {tip}
            </div>
        </div>
    );
};

// Main application layout, including header, navigation, and footer.
const AppLayout: React.FC<{ currentUser: User; handleLogout: () => void; toggleTheme: () => void; theme: string; }> = ({ currentUser, handleLogout, toggleTheme, theme }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: 'dashboard' },
        { path: '/clients', label: 'Clientes', icon: 'clients' },
        { path: '/schedule', label: 'Agenda', icon: 'calendar'},
        { path: '/procedures', label: 'Procedimentos', icon: 'clipboard' },
        { path: '/communication', label: 'Comunicação', icon: 'communication' },
        { path: '/financials', label: 'Financeiro', icon: 'dollar-sign' },
        { path: '/ideas', label: 'Ideias', icon: 'idea' },
    ];
    
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
                        <p>Logado como <span className="font-bold">{currentUser.username}</span></p>
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