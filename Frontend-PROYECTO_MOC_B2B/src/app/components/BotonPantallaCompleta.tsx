import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

const BotonPantallaCompleta = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            className="p-3 bg-[#0b1621] border border-[#152233] text-white rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center shadow-lg group"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
            {isFullscreen ? (
                <Minimize size={20} className="group-hover:scale-110 transition-transform" />
            ) : (
                <Maximize size={20} className="group-hover:scale-110 transition-transform" />
            )}
        </button>
    );
};

export default BotonPantallaCompleta;
