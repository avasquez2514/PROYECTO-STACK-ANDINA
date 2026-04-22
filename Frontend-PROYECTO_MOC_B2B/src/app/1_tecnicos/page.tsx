"use client";

import React, { useState, useEffect } from "react";
import { Activity, Zap, LogOut, ChevronRight, Hash, MapPin, User, FileText, Send, MessageSquare, Lock, Monitor, Trash2, Check, AlertTriangle, Image as ImageIcon, Plus } from "lucide-react";
import {
    plantillaCierreGPON,
    plantillaCierreHFC,
    plantillaCierreFIBRA,
    plantillaEnrutarGPON,
    plantillaEnrutarHFC,
    plantillaEnrutarFIBRA,
    plantillaAsesoriaParametros,
    plantillaAsesoriaInfraestructura
} from "../components/Plantillas";
import RenderizadorPlantilla from "../components/RenderizadorPlantilla";
import VentanaChat from "../components/VentanaChat";
import TablaHistorial from "../components/TablaHistorial";
import TerminalAutenticacion from "../components/TerminalAutenticacion";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Lista de pestañas principales para categorizar la vista.
 * @constant {string[]}
 */
const TABS = ["REPARACIONES", "INSTALACIONES"];

/**
 * Tipos de gestión que un técnico de campo puede registrar.
 * @constant {string[]}
 */
const GESTIONES = ["CIERRE", "ENRUTAR", "SOPORTE", "ASESORIA"];

/**
 * Diferentes tecnologías de red soportadas en la plataforma.
 * @constant {string[]}
 */
const TECNOLOGIAS = ["GPON", "HFC", "FIBRA"];

/**
 * Regiones geográficas o torres disponibles para asignar al caso.
 * @constant {string[]}
 */
const TORRES = ["ANTIOQUIA CENTRO", "ANTIOQUIA ORIENTE", "ATLANTICO-MAGDALENA-CESAR-LA GUAJIRA", "BOLIVAR", "BOGOTÁ", "EDATEL", "SANTANDERES"];

/**
 * Componente Principal `TecnicosPage`
 * 
 * Este componente representa el panel de control exclusivo para los técnicos de campo.
 * Funcionalidades principales:
 * 1. Autenticación técnica local.
 * 2. Formulario lógico dinámico según el tipo de gestión, tecnología y sitio.
 * 3. Inserción de evidencias fotográficas (exclusivo de "ENRUTAR").
 * 4. Paginación e historial de casos activos creados por el propio técnico.
 * 5. Integración con CHAT en vivo en caso de requerir soporte.
 * 
 * @returns {JSX.Element} Vista renderizada del terminal del técnico.
 */
export default function TecnicosPage() {
    const [hasMounted, setHasMounted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggedUser, setLoggedUser] = useState("TÉCNICO DE CAMPO");
    const [loggedUserId, setLoggedUserId] = useState<number | null>(null);

    // Auth State now moved to AuthTerminal component

    // Form State
    const [area, setArea] = useState(TABS[0]);
    const [gestion, setGestion] = useState(GESTIONES[0]);
    const [enSitio, setEnSitio] = useState("SÍ");
    const [torre, setTorre] = useState("");
    const [incidente, setIncidente] = useState("");
    const [tecnologia, setTecnologia] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [fechaGestion, setFechaGestion] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [subGestionAsesoria, setSubGestionAsesoria] = useState<string | null>(null);
    const [formExtra, setFormExtra] = useState<Record<string, string>>({});

    // History & Search State
    const [historial, setHistorial] = useState<any[]>([]);
    const [historialLoading, setHistorialLoading] = useState(true);
    const [hiddenIds, setHiddenIds] = useState<number[]>([]);
    const [searchIncidente, setSearchIncidente] = useState("");
    const [searchFecha, setSearchFecha] = useState("");

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    // Autocomplete State
    const [incSuggestions, setIncSuggestions] = useState<string[]>([]);
    const [showIncSuggestions, setShowIncSuggestions] = useState(false);

    // Chat State
    const [activeChatSoporteId, setActiveChatSoporteId] = useState<number | null>(null);
    const [activeChatIncidente, setActiveChatIncidente] = useState<string>("");

    // Evidencias (Only for ENRUTAR)
    const [evidencias, setEvidencias] = useState<{ file: File; previewUrl: string }[]>([]);

    // Change Password State
    const [showPassModal, setShowPassModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    // Change Name State
    const [showNameModal, setShowNameModal] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        setHasMounted(true);
        const userLocal = localStorage.getItem("phoenix_tech_user");
        if (userLocal) {
            try {
                const u = JSON.parse(userLocal);
                setLoggedUser(u.nombre_funcionario || u.login || u.nombre || "TÉCNICO DE CAMPO");
                setLoggedUserId(u.id || null);
                setIsAuthenticated(true);
            } catch (e) {
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    /**
     * Muestra una alerta no intrusiva (notificación flotante) al usuario en pantalla.
     * @param {string} message - El texto de la notificación.
     * @param {'success' | 'error' | 'info'} [type='info'] - Define el color y el ícono de la notificación.
     */
    const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        if (isAuthenticated) {
            cargarHistorial();
            const interval = setInterval(cargarHistorial, 5000);

            // Cargar IDs ocultos desde localStorage
            const storedHidden = localStorage.getItem(`hidden_cases_${loggedUser}`);
            if (storedHidden) {
                try {
                    setHiddenIds(JSON.parse(storedHidden));
                } catch (e) {
                    console.error("Error parseando casos ocultos", e);
                }
            }

            return () => clearInterval(interval);
        }
    }, [isAuthenticated, loggedUser]);

    /**
     * Oculta un caso de la lista local (Historial del técnico) almacenando el id en localStorage.
     * Esto no borra el caso en la base de datos, solo lo quita de la vista del técnico.
     * @param {number} id - El identificador del caso en soporte a ocultar.
     */
    const ocultarCaso = (id: number) => {
        const newHidden = [...hiddenIds, id];
        setHiddenIds(newHidden);
        localStorage.setItem(`hidden_cases_${loggedUser}`, JSON.stringify(newHidden));
    };

    /**
     * Consulta el backend para cargar todo el historial de soporte.
     * Luego se filtran sólo aquellos que coincidan con el técnico logueado actual (`loggedUser`),
     * y extrae los nombres únicos de los incidentes para el autocompletado en el formulario.
     */
    const cargarHistorial = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`);
            const data = await res.json();
            // Filtrar por el técnico autenticado usando nombre
            const filtrados = data
                .filter((d: any) => d.nombre === loggedUser)
                .sort((a: any, b: any) => b.id - a.id);
            setHistorial(filtrados);
            setHistorialLoading(false);
            
            // Extraer incidentes únicos para autocompletado
            const uniqueIncs = Array.from(new Set(data.map((d: any) => d.incidente).filter(Boolean))) as string[];
            setIncSuggestions(uniqueIncs);
        } catch (e) {
            console.error("Error cargando historial", e);
            setHistorialLoading(false);
        }
    };

    /**
     * Maneja el proceso de actualización de contraseña llamando a la API (verbo PATCH)
     * e informa al usuario sobre el resultado con notificaciones flotantes.
     */
    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            showNotify("Mínimo 4 caracteres", "error");
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/funcionarios/${loggedUserId}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                showNotify("CONTRASEÑA ACTUALIZADA", "success");
                setShowPassModal(false);
                setNewPassword("");
            } else {
                showNotify("ERROR AL ACTUALIZAR", "error");
            }
        } catch (e) {
            showNotify("ERROR DE CONEXIÓN", "error");
        }
    };

    // handleAuthSubmit moved to AuthTerminal

    /**
     * Borra la sesión local y resetea las variables de estado relacionadas a la autenticación.
     */
    const handleLogout = () => {
        localStorage.removeItem("phoenix_tech_user");
        setIsAuthenticated(false);
        setHistorial([]);
    };

    /**
     * Limpia completamente todos los campos del formulario de creación de una nueva gestión,
     * devolviendo el estado a su configuración inicial.
     */
    const limpiarTerminal = () => {
        setArea(TABS[0]);
        setGestion(GESTIONES[0]);
        setEnSitio("SÍ");
        setTorre("");
        setIncidente("");
        setTecnologia("");
        setObservaciones("");
        setFechaGestion(new Date().toISOString().split('T')[0]);
        setSubGestionAsesoria(null);
        setFormExtra({});
        setEvidencias([]);
    };

    /**
     * Captura, procesa y transmite los datos cargados en el formulario hacia la base de datos backend.
     * Incorpora manejo de Evidencias (.jpeg/png) y mapeo inteligente de observaciones según el área.
     * Utiliza FormData debido a que se requiere soporte Multipart (para carga de archivos).
     * 
     * @param {React.FormEvent} e - Evento de acción default de formulario
     */
    const enviarGestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incidente || !tecnologia || !torre) {
            showNotify("Faltan campos obligatorios", "error");
            return;
        }

        let finalObservaciones = observaciones || "SIN OBSERVACIONES";
        if (gestion === "ASESORIA" && subGestionAsesoria) {
            const extraText = Object.entries(formExtra)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" | ");
            finalObservaciones = `[${subGestionAsesoria}] ${extraText}${extraText ? ' -- ' : ''}${finalObservaciones}`;
        }

        const formData = new FormData();
        // Capturamos el tiempo local exacto del PC del técnico como un string plano (sin Z ni UTC)
        // Esto le dice al servidor "graba exactamente esta hora" sin conversiones.
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const localISO = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        
        formData.append("fecha_hora", localISO);
        formData.append("en_sitio", enSitio === "SÍ" ? "true" : "false");
        formData.append("nombre", loggedUser);
        formData.append("torre", torre);
        formData.append("incidente", incidente);
        formData.append("gestion", gestion);
        formData.append("observaciones", finalObservaciones);
        formData.append("plantilla", gestion === "ASESORIA" ? "{}" : JSON.stringify(formExtra));
        formData.append("tipo_servicio", tecnologia);
        formData.append("estado", "En gestión");
        formData.append("login_n1", "POR_ASIGNAR");
        formData.append("observaciones_ultima", "Registro inicial de gestión");
        
        // Seteamos las alertas de chat en TRUE (vistas) para que no aparezca el punto naranja
        // al crear la tarea. Solo aparecerá cuando realmente se envíe un mensaje.
        formData.append("chat_visto_soporte", "true");
        formData.append("chat_visto_tecnico", "true");
        formData.append("chat_visto_despacho", "true");
        
        if (gestion === "ENRUTAR" && evidencias.length > 0) {
            evidencias.forEach((ev, i) => {
                formData.append(`evidencia_${i}`, ev.file); // Append valid File object
            });
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                showNotify("GESTIÓN ENVIADA CORRECTAMENTE", "success");
                limpiarTerminal();
                cargarHistorial();
            } else {
                showNotify("ERROR AL ENVIAR GESTIÓN", "error");
            }
        } catch (e) {
            showNotify("ERROR DE CONEXIÓN", "error");
        }
    };

    const abrirChat = (id: number, inc: string) => {
        setActiveChatSoporteId(id);
        setActiveChatIncidente(inc);
    };

    if (!hasMounted) return <div className="min-h-screen bg-[#060d14]" />;

    // 1. VISTA DE AUTENTICACIÓN
    if (!isAuthenticated) {
        return (
            <TerminalAutenticacion 
                showNotify={showNotify}
                onLoginSuccess={(user) => {
                    setLoggedUser(user.nombre_funcionario || "TÉCNICO DE CAMPO");
                    setLoggedUserId(user.id);
                    setIsAuthenticated(true);
                    showNotify(`BIENVENIDO(A) ${user.nombre_funcionario.split(' ')[0]}`, "success");
                }} 
            />
        );
    }

    // 2. VISTA DE TÉCNICOS LOGUEADO
    return (
        <div className="min-h-screen bg-[#060d14] text-white font-sans overflow-x-hidden selection:bg-[#00e5a0]/30 selection:text-[#00e5a0]">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: `
              radial-gradient(circle at 0% 50%, rgba(0, 184, 229, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 50%, rgba(0, 229, 160, 0.15) 0%, transparent 50%),
              #060d14
            `
                    }}
                />
            </div>

            {/* Navbar */}
            <header className="relative z-10 border-b border-[#152233] bg-[#0b1621]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 border border-[#00e5a0]/20 pl-2 pr-6 py-2 rounded-xl bg-[#060d14] relative hud-corners shadow-[0_0_15px_rgba(0,229,160,0.05)]">
                    <div className="w-10 h-10 border border-[#00e5a0] rounded-lg flex items-center justify-center text-[#00e5a0] bg-[#00e5a0]/10 shadow-[0_0_10px_rgba(0,229,160,0.2)]">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] text-[#608096] uppercase font-black tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] shadow-[0_0_5px_#00e5a0] animate-pulse"></span>
                            CONECTADO COMO
                        </span>
                        <button 
                            onClick={() => {
                                setNewName(loggedUser);
                                setShowNameModal(true);
                            }}
                            className="text-xs font-black uppercase text-white tracking-widest hover:text-[#00e5a0] transition-colors flex items-center gap-2 group/edit"
                        >
                            {loggedUser}
                            <Plus size={10} className="opacity-30 group-hover/edit:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex text-[9px] font-black text-[#608096] tracking-[0.3em] uppercase items-center gap-6">
                    <span>SIMOC SYS · <span className="text-[#00e5a0]">V.02</span></span>
                    <div className="w-1 h-1 rounded-full bg-[#152233]" />
                    <span>SECURITY CLEARANCE REQUIRED</span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowPassModal(true)}
                        className="flex items-center gap-2 border border-[#152233] hover:border-[#00e5a0]/50 bg-[#060d14] hover:bg-[#00e5a0]/10 px-4 py-3 rounded-xl transition-all group"
                    >
                        <Lock size={14} className="text-[#608096] group-hover:text-[#00e5a0] transition-colors" />
                        <span className="text-[10px] text-[#608096] group-hover:text-[#00e5a0] font-black uppercase tracking-widest hidden sm:inline">CONTRSEÑA</span>
                    </button>

                    <button onClick={handleLogout} className="flex items-center gap-2 border border-[#152233] hover:border-[#e5003d]/50 bg-[#060d14] hover:bg-[#e5003d]/10 px-6 py-3 rounded-xl transition-all group">
                        <LogOut size={14} className="text-[#e5003d] group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] text-[#e5003d] font-black uppercase tracking-widest hidden sm:inline">CERRAR SESIÓN</span>
                    </button>
                </div>
            </header>

            <main className="relative z-10 max-w-5xl mx-auto p-4 md:p-8 space-y-8">

                {/* Formulario Inteligente */}
                <section className="border border-[#152233] bg-[#0b1621]/60 backdrop-blur-md rounded-2xl p-4 sm:p-8 shadow-2xl hud-corners relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-[#152233] pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px w-6 sm:w-8 bg-[#00e5a0]" />
                                <span className="text-[8px] sm:text-[9px] text-[#00e5a0] font-black uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(0,229,160,0.5)]">MANAGEMENT TERMINAL</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                                REGISTRO DE<br />
                                <span className="text-[#00e5a0]">GESTIÓN</span>
                            </h1>
                        </div>

                        <div className="flex w-full sm:w-auto bg-[#060d14] border border-[#152233] rounded-xl p-1 shadow-inner overflow-x-auto">
                            {TABS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setArea(t)}
                                    className={cn(
                                        "flex-1 px-4 sm:px-6 py-2.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                                        area === t ? "bg-[#00e5a0] text-[#060d14] shadow-[0_0_15px_rgba(0,229,160,0.4)]" : "text-[#608096] hover:text-white"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={enviarGestion} className="space-y-8 sm:space-y-10">
                        {/* Gestiones Selectors */}
                        <div className="flex overflow-x-auto border border-[#152233] bg-[#060d14] rounded-xl p-1 gap-1 custom-scrollbar">
                            {GESTIONES.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGestion(g)}
                                    className={cn(
                                        "min-w-[80px] flex-1 py-3 sm:py-4 px-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all text-center whitespace-nowrap",
                                        gestion === g ? "bg-[#0b1621] border border-[#00e5a0]/30 text-[#00e5a0] shadow-[inset_0_0_20px_rgba(0,229,160,0.1)]" : "text-[#608096] hover:text-white"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                            {/* Column 1 */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 text-[#00e5a0]">
                                    <MapPin size={18} className="drop-shadow-[0_0_8px_rgba(0,229,160,0.5)]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">DATOS DE UBICACIÓN</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-[#152233] to-transparent" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">¿EN SITIO?</label>
                                    <div className="flex gap-2">
                                        {["SÍ", "NO"].map(opt => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setEnSitio(opt)}
                                                className={cn(
                                                    "flex-1 py-4 text-[10px] font-black rounded-xl border transition-all",
                                                    enSitio === opt ? "bg-[#00e5a0]/10 border-[#00e5a0] text-[#00e5a0] shadow-[0_0_15px_rgba(0,229,160,0.15)]" : "bg-[#060d14] border-[#152233] text-[#608096]"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">TORRE ASIGNADA</label>
                                    <select
                                        value={torre}
                                        onChange={e => setTorre(e.target.value)}
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl px-4 py-4 text-xs font-medium text-white appearance-none outline-none focus:border-[#00e5a0]/50 focus:shadow-[0_0_15px_rgba(0,229,160,0.1)] transition-all custom-select"
                                    >
                                        <option value="">Seleccionar torre...</option>
                                        {TORRES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2 hidden">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">FECHA DE GESTIÓN</label>
                                    <input
                                        type="date"
                                        value={fechaGestion}
                                        onChange={e => setFechaGestion(e.target.value)}
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl px-4 py-4 text-xs font-medium text-white outline-none focus:border-[#00e5a0]/50 focus:shadow-[0_0_15px_rgba(0,229,160,0.1)] transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 text-[#00e5a0]">
                                    <FileText size={18} className="drop-shadow-[0_0_8px_rgba(0,229,160,0.5)]" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">DETALLES TÉCNICOS</h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-[#152233] to-transparent" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">NÚMERO DE INCIDENTE</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#608096]" />
                                        <input
                                            type="text"
                                            value={incidente}
                                            onChange={e => {
                                                setIncidente(e.target.value);
                                                setShowIncSuggestions(true);
                                            }}
                                            onFocus={() => setShowIncSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowIncSuggestions(false), 200)}
                                            placeholder="# INC0000000"
                                            className="w-full bg-[#060d14] border border-[#152233] rounded-xl pl-12 pr-4 py-4 text-xs font-mono font-bold text-white outline-none focus:border-[#00e5a0]/50 focus:shadow-[0_0_15px_rgba(0,229,160,0.1)] transition-all uppercase placeholder:text-[#152233]"
                                        />
                                        
                                        {/* Intelligent Suggestions */}
                                        {showIncSuggestions && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-[#0b1621] border border-[#152233] rounded-xl overflow-hidden z-50 shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                                                {incSuggestions
                                                    .filter(s => s.toLowerCase().includes(incidente.toLowerCase()) && s !== incidente)
                                                    .slice(0, 5)
                                                    .map((s, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                setIncidente(s);
                                                                setShowIncSuggestions(false);
                                                            }}
                                                            className="w-full px-5 py-3 text-left text-[10px] font-bold text-[#608096] hover:bg-[#00e5a0]/10 hover:text-[#00e5a0] border-b border-[#152233]/50 last:border-0 transition-colors flex items-center gap-3"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-[#00e5a0]" />
                                                            {s}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">TECNOLOGÍA DE RED</label>
                                    <select
                                        value={tecnologia}
                                        onChange={e => setTecnologia(e.target.value)}
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl px-4 py-4 text-xs font-medium text-white appearance-none outline-none focus:border-[#00e5a0]/50 focus:shadow-[0_0_15px_rgba(0,229,160,0.1)] transition-all custom-select"
                                    >
                                        <option value="">Seleccionar tecnología...</option>
                                        {TECNOLOGIAS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest block pl-2">OBSERVACIONES INICIALES</label>
                                    <textarea
                                        value={observaciones}
                                        onChange={e => setObservaciones(e.target.value)}
                                        placeholder="Ingrese hallazgos encontrados en sitio..."
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl px-6 py-5 text-xs text-white outline-none focus:border-[#00e5a0]/50 focus:shadow-[0_0_15px_rgba(0,229,160,0.1)] transition-all resize-none h-24 placeholder:text-[#3a5c72]"
                                    />
                                </div>

                                {gestion === "ENRUTAR" && (
                                    <div className="space-y-4 pt-4 border-t border-[#152233]">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] text-[#00e5a0] font-black uppercase tracking-widest flex items-center gap-2">
                                                <ImageIcon size={14} /> ANEXAR EVIDENCIAS (FOTOS)
                                            </label>
                                            <span className="text-[8px] text-[#608096] font-bold uppercase">{evidencias.length} / 5</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                            {evidencias.map((ev, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#00e5a0]/30 group">
                                                    <img src={ev.previewUrl} className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            URL.revokeObjectURL(ev.previewUrl);
                                                            setEvidencias(evidencias.filter((_, idx) => idx !== i));
                                                        }}
                                                        className="absolute inset-0 bg-rose-500/80 flex items-center justify-center transition-opacity"
                                                    >
                                                        <Trash2 size={16} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            {evidencias.length < 5 && (
                                                <label className="aspect-square flex flex-col items-center justify-center bg-[#060d14] border border-dashed border-[#152233] rounded-xl cursor-pointer hover:border-[#00e5a0]/50 transition-all text-[#3a5c72] hover:text-[#00e5a0]">
                                                    <Plus size={20} />
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const previewUrl = URL.createObjectURL(file);
                                                                setEvidencias([...evidencias, { file, previewUrl }]);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Intelligent Dynamic Area */}
                        <div className="border border-dashed border-[#152233] rounded-xl flex items-center justify-center p-4 sm:p-8 bg-[#060d14]/50 my-6 sm:my-8 text-center sm:text-left">
                            {!tecnologia ? (
                                <p className="text-[9px] font-black text-[#608096] tracking-[0.2em] uppercase text-center">
                                    • SELECCIONE TECNOLOGÍA DE RED PARA ACTIVAR PLANTILLA DE {gestion} •
                                </p>
                            ) : (
                                <div className="w-full text-left">
                                    {gestion === "CIERRE" && tecnologia === "GPON" && <RenderizadorPlantilla titulo="Plantilla Cierre GPON" campos={plantillaCierreGPON} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "CIERRE" && tecnologia === "HFC" && <RenderizadorPlantilla titulo="Plantilla Cierre HFC" campos={plantillaCierreHFC} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "CIERRE" && tecnologia === "FIBRA" && <RenderizadorPlantilla titulo="Plantilla Cierre FIBRA" campos={plantillaCierreFIBRA} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "GPON" && <RenderizadorPlantilla titulo="Plantilla Enrutar GPON" campos={plantillaEnrutarGPON} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "HFC" && <RenderizadorPlantilla titulo="Plantilla Enrutar HFC" campos={plantillaEnrutarHFC} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "FIBRA" && <RenderizadorPlantilla titulo="Plantilla Enrutar FIBRA" campos={plantillaEnrutarFIBRA} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    
                                    {/* Nueva lógica para Asesoría */}
                                    {gestion === "ASESORIA" && (
                                        <div className="space-y-6">
                                            <div className="flex gap-4 justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSubGestionAsesoria("PARAMETROS");
                                                        setFormExtra({});
                                                    }}
                                                    className={cn(
                                                        "px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border",
                                                        subGestionAsesoria === "PARAMETROS" 
                                                            ? "bg-[#00e5a0] text-[#060d14] border-[#00e5a0] shadow-[0_0_20px_rgba(0,229,160,0.3)]" 
                                                            : "bg-[#0b1621] text-[#608096] border-[#152233] hover:border-[#00e5a0]/50"
                                                    )}
                                                >
                                                    PARAMETROS
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSubGestionAsesoria("INFRAESTRUCTURA");
                                                        setFormExtra({});
                                                    }}
                                                    className={cn(
                                                        "px-8 py-4 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border",
                                                        subGestionAsesoria === "INFRAESTRUCTURA" 
                                                            ? "bg-[#00b8e5] text-[#060d14] border-[#00b8e5] shadow-[0_0_20px_rgba(0,184,229,0.3)]" 
                                                            : "bg-[#0b1621] text-[#608096] border-[#152233] hover:border-[#00b8e5]/50"
                                                    )}
                                                >
                                                    INFRAESTRUCTURA
                                                </button>
                                            </div>

                                            {!subGestionAsesoria && (
                                                <p className="text-[9px] font-black text-[#00e5a0] tracking-[0.2em] uppercase text-center glow-text-green">
                                                    • SELECCIONE TIPO DE ASESORÍA PARA CONTINUAR •
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {gestion === "SOPORTE" && (
                                        <p className="text-[9px] font-black text-[#00e5a0] tracking-[0.2em] uppercase text-center glow-text-green">
                                            • GESTIÓN SELECCIONADA REQUIERE NOVEDAD Y CHAT DIRECTO CON SOPORTE •
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Form Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 border-t border-[#152233] pt-8">
                            <button
                                type="button"
                                onClick={limpiarTerminal}
                                className="flex-1 py-5 rounded-xl border border-[#152233] bg-[#060d14] text-[10px] font-black tracking-[0.2em] text-[#608096] uppercase hover:bg-[#152233]/40 transition-colors"
                            >
                                LIMPIAR TERMINAL
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] flex items-center justify-center gap-3 py-5 rounded-xl bg-[#00e5a0] text-[#060d14] text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(0,229,160,0.3)] hover:shadow-[0_0_30px_rgba(0,229,160,0.5)] hover:bg-[#00c985] transition-all"
                            >
                                <Send size={16} />
                                ENVIAR GESTIÓN A SOPORTE
                            </button>
                        </div>
                    </form>
                </section>

                {/* Historial de Gestiones y Chat */}
                <section className="border border-[#152233] bg-[#0b1621]/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl hud-corners relative mt-12">
                <TablaHistorial 
                    historial={historial}
                    loading={historialLoading}
                    hiddenIds={hiddenIds}
                    searchIncidente={searchIncidente}
                    setSearchIncidente={setSearchIncidente}
                    searchFecha={searchFecha}
                    setSearchFecha={setSearchFecha}
                    abrirChat={abrirChat}
                    ocultarCaso={ocultarCaso}
                />
                </section>

            </main>

            {/* CHAT WINDOW COMPONENT */}
            {activeChatSoporteId !== null && (
                <VentanaChat
                    soporteId={activeChatSoporteId}
                    incidente={activeChatIncidente}
                    remitenteActual={"TECNICO"}
                    nombreRemitente={loggedUser}
                    onClose={() => setActiveChatSoporteId(null)}
                />
            )}

            {/* Modal Cambio de Contraseña */}
            {showPassModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-[#0b1621] border border-[#152233] rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_30px_100px_rgba(0,0,0,0.8)] hud-corners relative">
                        <button 
                            onClick={() => setShowPassModal(false)}
                            className="absolute top-6 right-6 text-[#608096] hover:text-white transition-colors"
                        >
                            <LogOut size={20} className="rotate-180" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-2xl flex items-center justify-center text-[#00e5a0]">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Cambiar <span className="text-[#00e5a0]">Contraseña</span></h3>
                                <p className="text-[9px] font-black text-[#608096] uppercase tracking-[0.2em] mt-1">Actualiza tu clave de acceso</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest pl-2">NUEVA CONTRASEÑA</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#608096]" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl pl-12 pr-4 py-4 text-xs text-white outline-none focus:border-[#00e5a0]/50 transition-all font-black tracking-widest"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowPassModal(false)}
                                    className="flex-1 px-6 py-4 border border-[#152233] text-[#608096] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleUpdatePassword}
                                    className="flex-1 px-6 py-4 bg-[#00e5a0]/10 border border-[#00e5a0] text-[#00e5a0] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00e5a0]/20 transition-all shadow-[0_0_20px_rgba(0,229,160,0.1)]"
                                >
                                    ACTUALIZAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Profile/Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-[#0b1621] border border-[#152233] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5a0]/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-[#00e5a0]/20 transition-all duration-1000" />
                        
                        <div className="relative space-y-8 text-center">
                            <div className="w-20 h-20 bg-[#00e5a0]/10 border border-[#00e5a0]/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-[#00e5a0]/10 group-hover:scale-105 transition-all duration-500">
                                <User size={32} className="text-[#00e5a0]" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">IDENTIDAD <span className="text-[#00e5a0]">OPERATIVA</span></h3>
                                <p className="text-[9px] text-[#608096] font-bold uppercase tracking-[0.4em]">MODIFICAR DISPLAY NAME</p>
                            </div>

                            <div className="space-y-4 text-left">
                                <label className="text-[9px] text-[#608096] font-black uppercase tracking-widest pl-2">NUEVO NOMBRE DE USUARIO</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#608096]" />
                                    <input
                                        type="text"
                                        value={newName}
                                        autoFocus
                                        onChange={e => setNewName(e.target.value.toUpperCase())}
                                        placeholder="EJ. ANDERSON VASQUEZ"
                                        className="w-full bg-[#060d14] border border-[#152233] rounded-xl pl-12 pr-4 py-4 text-xs text-white outline-none focus:border-[#00e5a0]/50 transition-all font-black tracking-widest placeholder:text-[#152233]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowNameModal(false)}
                                    className="flex-1 px-6 py-4 border border-[#152233] text-[#608096] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all outline-none"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={() => {
                                        if (!newName.trim()) {
                                            showNotify("INGRESE UN NOMBRE VÁLIDO", "error");
                                            return;
                                        }
                                        setLoggedUser(newName);
                                        // Update in localStorage as well
                                        const userLocal = localStorage.getItem("phoenix_tech_user");
                                        if (userLocal) {
                                            try {
                                                const u = JSON.parse(userLocal);
                                                u.nombre_funcionario = newName;
                                                localStorage.setItem("phoenix_tech_user", JSON.stringify(u));
                                            } catch(e) {}
                                        }
                                        setShowNameModal(false);
                                        showNotify("IDENTIDAD ACTUALIZADA EXITOSAMENTE", "success");
                                    }}
                                    className="flex-1 px-6 py-4 bg-[#00e5a0]/10 border border-[#00e5a0] text-[#00e5a0] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00e5a0]/20 transition-all shadow-[0_0_20px_rgba(0,229,160,0.1)] outline-none"
                                >
                                    GUARDAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Component */}
            {notification && (
                <div className={cn(
                    "fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-5 rounded-[2rem] border backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500",
                    notification.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    notification.type === 'error' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" :
                    "bg-blue-500/10 border-blue-500/30 text-blue-400"
                )}>
                    {notification.type === 'success' && <Check size={20} className="drop-shadow-[0_0_8px_currentColor]" />}
                    {notification.type === 'error' && <AlertTriangle size={20} className="drop-shadow-[0_0_8px_currentColor]" />}
                    {notification.type === 'info' && <Activity size={20} className="drop-shadow-[0_0_8px_currentColor]" />}
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{notification.message}</span>
                </div>
            )}
        </div>
    );
}