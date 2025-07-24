import React, { useEffect } from 'react';

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

export default Stardust;
