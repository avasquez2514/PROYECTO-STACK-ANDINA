"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, X, Clock, Image as ImageIcon, Paperclip, Share2, Copy, Zap, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import imageCompression from 'browser-image-compression';

/**
 * ChatWindow Component - SIMOC Edition
 * 
 * Interfaz de chat en tiempo real diseñada para el sistema SIMOC.
 * Permite adjuntar (y pegar) imágenes en base64 y reenviar mensajes a otros chats.
 */

/**
 * Interfaz para definir la estructura de un mensaje en el sistema de chat.
 * @interface Message
 */
interface Message {
    /** Identificador único del mensaje (opcional en creación local) */
    id?: number;
    /** Nombre o rol del emisor */
    remitente: string;
    /** Cuerpo del mensaje en texto plano */
    mensaje: string;
    /** URL de la imagen adjunta o Base64 string */
    imagen?: string; // Base64
    /** Timestamp formato ISO cuando se envió */
    fecha_hora?: string;
}

/**
 * Propiedades del componente VentanaChat.
 * @interface ChatWindowProps
 */
interface ChatWindowProps {
    /** ID del caso de soporte actual */
    soporteId: number;
    /** Nombre clave (código) del incidente en gestión */
    incidente: string;
    /** Emisor (Ej: "SOPORTE", "TECNICO", "DESPACHO") */
    remitenteActual: string;
    /** Nombre exacto del técnico que está enviando (opcional) */
    nombreRemitente?: string;
    /** Función de cierre o destabbed del UI Modal de chat */
    onClose: () => void;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente VentanaChat - SIMOC Edition
 * 
 * Interfaz modal de chat full-screen. Se conecta mediante WebSockets (Django Channels) a
 * la cola de un incidente particular. Permite copiado y envío de imágenes grandes
 * con compresión web-worker on-the-fly (`browser-image-compression`) y reenvío de mensajes
 * directos a otros casos creados.
 * 
 * @param {ChatWindowProps} props
 * @returns {JSX.Element} Interfaz del chat modal
 */
const VentanaChat: React.FC<ChatWindowProps> = ({ soporteId, incidente, remitenteActual, nombreRemitente, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sharingMessage, setSharingMessage] = useState<Message | null>(null);
    const [incidentsList, setIncidentsList] = useState<any[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    
    const [isCompressing, setIsCompressing] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Cargar historial inicial y lista de compartición
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/?soporte_id=${soporteId}`);
                const data = await res.json();
                setMessages(data);
            } catch (error) {
                console.error("Error cargando historial de chat:", error);
            }
        };
        fetchHistory();
        cargarIncidentesParaCompartir();
    }, [soporteId]);

    const cargarIncidentesParaCompartir = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`);
            const data = await res.json();
            // Filtrar el incidente actual y mostrar los más recientes para reenviar
            setIncidentsList(data.filter((d: any) => d.id !== soporteId).slice(0, 15));
        } catch (e) { console.error(e); }
    };

    // 2. Conexión WebSocket
    useEffect(() => {
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/chat/${soporteId}/`);

        const markAsRead = async () => {
            let field = '';
            if (remitenteActual === 'SOPORTE') field = 'chat_visto_soporte';
            else if (remitenteActual === 'DESPACHO') field = 'chat_visto_despacho';
            else field = 'chat_visto_tecnico'; 

            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/${soporteId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: true }),
                });
            } catch (error) { console.error("Error marking as read:", error); }
        };

        ws.onopen = () => {
            console.log("✅ SIMOC Socket Connected");
            markAsRead();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, {
                remitente: data.remitente,
                mensaje: data.message,
                imagen: data.imagen,
                fecha_hora: new Date().toISOString()
            }]);

            if (data.remitente !== remitenteActual) {
                markAsRead();
                // Sonido de notificación para el receptor
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                    audio.volume = 0.5;
                    audio.play();
                } catch (e) {
                    console.log("Audio play blocked by browser policy");
                }
            }
        };
        ws.onerror = (error) => console.error("❌ WebSocket Error", error);
        ws.onclose = () => console.log("ℹ️ SIMOC Socket Offline");

        setSocket(ws);

        return () => {
            ws.close();
        };
    }, [soporteId, remitenteActual]);

    // Autoscroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleImageSelect = async (file: File) => {
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            toast.error("El archivo seleccionado no es una imagen");
            return;
        }

        setIsCompressing(true);
        const options = {
            maxSizeMB: 1,            // Máximo 1MB
            maxWidthOrHeight: 1920, // Resolución Full HD máxima
            useWebWorker: true,
            initialQuality: 0.8,    // Calidad inicial del 80%
        };

        try {
            console.log(`Tamano original: ${file.size / 1024 / 1024} MB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`Tamano comprimido: ${compressedFile.size / 1024 / 1024} MB`);

            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setIsCompressing(false);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error("Error al comprimir la imagen:", error);
            toast.error("No se pudo procesar la imagen");
            setIsCompressing(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const item = e.clipboardData.items[0];
        if (item?.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            if (blob) handleImageSelect(blob);
        }
    };

    const sendMessage = () => {
        if (socket && (inputMessage.trim() || selectedImage)) {
            socket.send(JSON.stringify({
                message: inputMessage,
                remitente: nombreRemitente || remitenteActual,
                rol: remitenteActual,
                imagen: selectedImage
            }));
            setInputMessage("");
            setSelectedImage(null);
        }
    };

    const forwardMessage = async (targetSoporteId: number) => {
        if (!sharingMessage) return;
        
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    soporte: targetSoporteId,
                    remitente: `${remitenteActual} (Reenviado)${nombreRemitente ? ` - ${nombreRemitente}` : ''}`,
                    mensaje: sharingMessage.mensaje || "Contenido reenviado",
                    imagen: sharingMessage.imagen
                }),
            });
            
            setSharingMessage(null);
            setShowShareModal(false);
            toast.success(`Mensaje reenviado al Caso ID ${targetSoporteId}`);
        } catch (error) {
            console.error(error);
            toast.error("Error al reenviar");
        }
    };

    const formatearHora = (isoStr?: string) => {
        if (!isoStr) return "";
        const date = new Date(isoStr);
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="bg-[#0b1621] border border-white/5 w-full max-w-2xl h-[700px] flex flex-col rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200 relative">

                {/* Header */}
                <div className="p-8 border-b border-white/5 bg-[#060d14]/40 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white italic uppercase tracking-[0.2em]">SISTEMA CHAT SIMOC</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-[#00e5a0] uppercase tracking-tighter opacity-70">INCIDENTE</span>
                                <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black font-mono tracking-[0.2em] border border-emerald-500/20">
                                    {incidente}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-[#060d14] hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all text-slate-400 group border border-white/5"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Messages Pool */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(0,229,160,0.03),transparent)]"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale scale-90">
                            <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-6 animate-pulse">
                                <MessageSquare size={40} className="text-emerald-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">A la espera de mensajes...</p>
                        </div>
                    )}

                    {messages.map((msg, i) => {
                        const isMe = msg.remitente.includes(remitenteActual) || (nombreRemitente && msg.remitente.includes(nombreRemitente));
                        return (
                            <div key={i} className={cn("flex flex-col group/msg", isMe ? "items-end" : "items-start")}>
                                <div className={cn("flex items-center gap-3 mb-2", isMe ? "flex-row-reverse" : "flex-row")}>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.remitente}</p>
                                    <span className="text-[8px] text-slate-600 font-bold tracking-tight bg-white/5 px-2 py-0.5 rounded-full">{formatearHora(msg.fecha_hora)}</span>
                                    
                                    <div className={cn(
                                        "flex gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200",
                                        isMe ? "mr-2" : "ml-2"
                                    )}>
                                        <button 
                                            onClick={() => {
                                                setSharingMessage(msg);
                                                setShowShareModal(true);
                                            }}
                                            className="p-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg text-slate-500 border border-white/5 transition-all"
                                            title="Compartir con otro chat"
                                        >
                                            <Share2 size={12} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(msg.mensaje);
                                                // Alert discreto si es necesario
                                            }}
                                            className="p-1.5 bg-white/5 hover:bg-blue-500/20 hover:text-blue-500 rounded-lg text-slate-500 border border-white/5 transition-all"
                                            title="Copiar contenido"
                                        >
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className={cn(
                                    "max-w-[85%] rounded-[2rem] text-[13px] transition-all shadow-xl overflow-hidden",
                                    isMe
                                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-[#060d14] font-bold rounded-tr-none border border-emerald-400/50"
                                        : "bg-[#060d14]/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-tl-none"
                                )}>
                                    {msg.imagen && (() => {
                                        const imageUrl = msg.imagen.startsWith('data:') || msg.imagen.startsWith('http') 
                                            ? msg.imagen 
                                            : `${process.env.NEXT_PUBLIC_API_URL}${msg.imagen}`;
                                        
                                        const handleDownload = (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            // Si es base64, descarguemos usando un anchor
                                            if (imageUrl.startsWith('data:')) {
                                                const a = document.createElement('a');
                                                a.href = imageUrl;
                                                a.download = `chat_image_${new Date().getTime()}.png`;
                                                a.click();
                                            } else {
                                                // Descarga pasando por un anchor
                                                window.open(imageUrl, '_blank');
                                            }
                                        };

                                        return (
                                            <div className="p-1.5 relative group/img">
                                                <img 
                                                    src={imageUrl} 
                                                    alt="Chat attachment" 
                                                    className="rounded-2xl max-h-[350px] w-full object-cover cursor-pointer hover:scale-[1.01] transition-transform shadow-lg"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                />
                                                <button
                                                    onClick={handleDownload}
                                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/80 backdrop-blur-md"
                                                    title="Descargar imagen"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                    {msg.mensaje && (
                                        <div className="px-6 py-4 leading-relaxed break-words whitespace-pre-wrap">
                                            {msg.mensaje}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Preview Selected Image */}
                {selectedImage && (
                    <div className="mx-10 mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-between animate-in slide-in-from-bottom-5">
                        <div className="flex items-center gap-4">
                            <img src={selectedImage} className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30 shadow-lg" alt="Preview" />
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">✓ IMAGEN LISTA PARA TRANSMITIR</p>
                        </div>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="p-2 bg-rose-500/20 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-8 bg-[#060d14]/40 border-t border-white/5 shrink-0">
                    <div className="flex items-center gap-4 p-3 bg-[#0b1621] border border-white/5 rounded-[2.25rem] group focus-within:border-emerald-500/50 transition-all shadow-inner">
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageSelect(file);
                            }}
                        />
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-[#060d14] hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-500 rounded-2xl transition-all border border-white/5"
                            title="Adjuntar imagen"
                        >
                            <ImageIcon size={20} />
                        </button>

                        <textarea
                            rows={1}
                            placeholder="ESCRIBE O PEGA UNA IMAGEN AQUÍ..."
                            value={inputMessage}
                            onPaste={handlePaste}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className="flex-1 bg-transparent px-4 py-2 outline-none text-[13px] text-slate-200 resize-none max-h-32 custom-scrollbar font-medium placeholder:text-slate-600"
                        />
                        
                        <button
                            onClick={sendMessage}
                            disabled={!inputMessage.trim() && !selectedImage || isCompressing}
                            className="p-4 bg-emerald-500 text-[#060d14] rounded-2xl hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale transition-all shadow-[0_10px_30px_rgba(0,229,160,0.2)] active:scale-95"
                        >
                            {isCompressing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="translate-x-0.5" />}
                        </button>
                    </div>
                </div>

                {/* Share/Forward Modal Overlay */}
                {showShareModal && (
                    <div className="absolute inset-0 z-[210] bg-[#060d14]/95 backdrop-blur-3xl p-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase mr-4">REENVIAR GESTIÓN</h4>
                                <p className="text-[10px] text-[#00e5a0] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">SELECCIONA EL DESTINO EN SIMOC</p>
                            </div>
                            <button onClick={() => setShowShareModal(false)} className="p-4 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all text-slate-400">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4">
                            {incidentsList.length === 0 ? (
                                <p className="text-center text-slate-600 text-xs py-20 font-bold uppercase tracking-widest">No hay otros chats disponibles</p>
                            ) : (
                                incidentsList.map((inc) => (
                                    <button
                                        key={inc.id}
                                        onClick={() => forwardMessage(inc.id)}
                                        className="w-full p-6 bg-[#0b1621] border border-white/5 rounded-[2rem] flex items-center justify-between hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group lg:px-8 shadow-lg"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-[#060d14] rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
                                                <Zap size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[13px] font-black text-white uppercase group-hover:text-emerald-500 transition-colors font-mono tracking-widest">
                                                    {inc.incidente || "INC-00000"}
                                                </p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{inc.nombre}</p>
                                            </div>
                                        </div>
                                        <div className="px-5 py-2.5 bg-white/5 rounded-xl border border-white/5 text-[9px] font-black group-hover:bg-emerald-500 group-hover:text-[#060d14] transition-all uppercase tracking-widest">
                                            Transmitir aquí
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VentanaChat;
