import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateMascotTip } from '../../services/geminiService';
import { Icon } from '../common/Icon';

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

export default Mascot;
