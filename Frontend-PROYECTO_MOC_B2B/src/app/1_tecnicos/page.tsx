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
} from "../components/plantillas";
import PlantillaRender from "../components/PlantillaRender";
import ChatWindow from "../components/ChatWindow";
import HistorialTable from "../components/HistorialTable";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const TABS = ["REPARACIONES", "INSTALACIONES"];
const GESTIONES = ["CIERRE", "ENRUTAR", "SOPORTE", "ASESORIA"];
const TECNOLOGIAS = ["GPON", "HFC", "FIBRA"];
const TORRES = ["ANTIOQUIA CENTRO", "ANTIOQUIA ORIENTE", "ATLANTICO-MAGDALENA-CESAR-LA GUAJIRA", "BOLIVAR", "BOGOTÁ", "EDATEL", "SANTANDERES"];

export default function TecnicosPage() {
    const [hasMounted, setHasMounted] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loggedUser, setLoggedUser] = useState("TÉCNICO DE CAMPO");
    const [loggedUserId, setLoggedUserId] = useState<number | null>(null);

    // Auth State
    const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
    const [authForm, setAuthForm] = useState({
        cedula: "",
        password: "",
        nombre: "",
        celular: ""
    });
    const [authLoading, setAuthLoading] = useState(false);

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
    const [evidencias, setEvidencias] = useState<string[]>([]);

    // Change Password State
    const [showPassModal, setShowPassModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");

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

    const ocultarCaso = (id: number) => {
        const newHidden = [...hiddenIds, id];
        setHiddenIds(newHidden);
        localStorage.setItem(`hidden_cases_${loggedUser}`, JSON.stringify(newHidden));
    };

    const cargarHistorial = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/soporte/");
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

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            showNotify("Mínimo 4 caracteres", "error");
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/funcionarios/${loggedUserId}/`, {
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

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);

        if (authMode === "REGISTER") {
            // Registro de Técnico
            if (!authForm.cedula || !authForm.nombre || !authForm.password) {
                showNotify("Por favor, complete los campos obligatorios.", "error");
                setAuthLoading(false);
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:8000/api/funcionarios/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cedula: authForm.cedula,
                        password: authForm.password,
                        nombre_funcionario: authForm.nombre.toUpperCase(),
                        celular: authForm.celular
                    })
                });

                if (res.ok) {
                    showNotify("REGISTRO EXITOSO. AHORA PUEDES INGRESAR.", "success");
                    setAuthMode("LOGIN");
                    setAuthForm({ ...authForm, password: "" }); // Limpiar password tras registro
                } else {
                    const errorData = await res.json();
                    let msg = "ERROR AL REGISTRAR";
                    if (errorData.nombre_funcionario) msg = "EL NOMBRE YA ESTÁ REGISTRADO";
                    if (errorData.cedula) msg = "LA CÉDULA YA ESTÁ REGISTRADA";
                    showNotify(msg, "error");
                }
            } catch (error) {
                showNotify("ERROR DE CONEXIÓN AL BACKEND.", "error");
            }
        } else {
            // Login de Técnico
            if (!authForm.cedula || !authForm.password) {
                showNotify("Por favor ingrese cédula y contraseña.", "error");
                setAuthLoading(false);
                return;
            }

            try {
                const res = await fetch("http://127.0.0.1:8000/api/funcionarios/login/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cedula: authForm.cedula,
                        password: authForm.password
                    })
                });

                if (res.ok) {
                    const user = await res.json();
                    localStorage.setItem("phoenix_tech_user", JSON.stringify(user));
                    setLoggedUser(user.nombre_funcionario || "TÉCNICO DE CAMPO");
                    setLoggedUserId(user.id);
                    setIsAuthenticated(true);
                    showNotify(`BIENVENIDO(A) ${user.nombre_funcionario.split(' ')[0]}`, "success");
                } else {
                    const errorData = await res.json();
                    showNotify(errorData.error || "ERROR EN LAS CREDENCIALES", "error");
                }
            } catch (error) {
                showNotify("ERROR DE CONEXIÓN AL BACKEND.", "error");
            }
        }

        setAuthLoading(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("phoenix_tech_user");
        setIsAuthenticated(false);
        setAuthForm({ ...authForm, password: "" }); // limpiar
        setHistorial([]);
    };

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

        const payload = {
            fecha_hora: new Date().toISOString(),
            en_sitio: enSitio === "SÍ",
            nombre: loggedUser,
            torre: torre,
            incidente: incidente,
            gestion: gestion,
            observaciones: finalObservaciones,
            plantilla: gestion === "ASESORIA" ? "{}" : JSON.stringify(formExtra),
            tipo_servicio: tecnologia,
            estado: "En gestión",
            login_n1: "POR_ASIGNAR",
            observaciones_ultima: "Registro inicial de gestión",
            evidencias: gestion === "ENRUTAR" ? JSON.stringify(evidencias) : null
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/api/soporte/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
            <div className="min-h-screen bg-[#060d14] font-sans flex items-center justify-center p-6 relative overflow-hidden">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div
                        className="absolute inset-0 opacity-40 transition-opacity duration-1000"
                        style={{
                            background: `
                            radial-gradient(ellipse 55% 65% at 10% 55%, #0a2a44 0%, transparent 65%),
                            radial-gradient(ellipse 45% 50% at 88% 18%, #082a1e 0%, transparent 60%),
                            radial-gradient(ellipse 40% 40% at 70% 85%, #051820 0%, transparent 60%),
                            #060d14
                        `
                        }}
                    />
                </div>

                <div className="relative z-10 w-full max-w-sm">
                    <div className="bg-[#0b1621] border border-[#152233] p-10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center">
                        <div className="w-20 h-20 border-2 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,229,160,0.2)] bg-[#060d14] border-[#00e5a0] text-[#00e5a0]">
                            <Zap size={36} fill="currentColor" className="opacity-90" />
                        </div>

                        <div className="text-center mb-10 space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">BIENVENIDO A<br /><span className="text-[#00e5a0] text-4xl font-[900]">SIMOC</span></h2>
                            <p className="text-[10px] text-[#608096] font-bold uppercase tracking-[0.4em] opacity-80">TERMINAL DE GESTIÓN</p>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="w-full space-y-6">
                            {authMode === "REGISTER" && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">NOMBRE COMPLETO</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                                            <input
                                                type="text"
                                                required
                                                value={authForm.nombre}
                                                onChange={(e) => setAuthForm({ ...authForm, nombre: e.target.value })}
                                                className="w-full bg-white text-[#060d14] text-xs font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400"
                                                placeholder="Nombres y apellidos"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CELULAR (OPCIONAL)</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                                            <input
                                                type="text"
                                                value={authForm.celular}
                                                onChange={(e) => setAuthForm({ ...authForm, celular: e.target.value })}
                                                className="w-full bg-white text-[#060d14] text-xs font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400"
                                                placeholder="Ej. 300 000 0000"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CÉDULA DE IDENTIDAD</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                                    <input
                                        type="text"
                                        required
                                        value={authForm.cedula}
                                        onChange={(e) => setAuthForm({ ...authForm, cedula: e.target.value })}
                                        className="w-full bg-white text-[#060d14] text-sm font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400 shadow-inner"
                                        placeholder="452547"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CONTRASEÑA DE ACCESO</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                                    <input
                                        type="password"
                                        required
                                        value={authForm.password}
                                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                        className="w-full bg-white text-[#060d14] text-sm font-black px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400 shadow-inner"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-4 bg-[#061511] hover:bg-[#0a231a] border-2 border-[#00e5a0]/80 text-white text-[11px] font-[900] uppercase tracking-[0.2em] py-5 rounded-2xl mt-10 transition-all shadow-[0_0_30px_rgba(0,229,160,0.1)] hover:shadow-[0_0_40px_rgba(0,229,160,0.3)] disabled:opacity-50 relative group overflow-hidden"
                            >
                                <span className="relative z-10">{authLoading ? "PROCESANDO..." : (authMode === "LOGIN" ? "INGRESAR A TERMINAL" : "REGISTRAR TÉCNICO")}</span>
                                <div className="bg-[#00e5a0] p-1.5 rounded-lg text-[#061511]">
                                    <Monitor size={16} strokeWidth={3} />
                                </div>
                            </button>
                        </form>

                        <div className="mt-8 text-[9px] font-bold text-[#608096] tracking-widest uppercase">
                            {authMode === "LOGIN" ? (
                                <>
                                    ¿No tienes cuenta? <button type="button" onClick={() => setAuthMode("REGISTER")} className="text-[#00e5a0] hover:underline ml-1">Regístrate aquí</button>
                                </>
                            ) : (
                                <>
                                    ¿Ya tienes cuenta? <button type="button" onClick={() => setAuthMode("LOGIN")} className="text-[#00e5a0] hover:underline ml-1">Ingresa aquí</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-[7px] font-black text-[#3a5c72] uppercase tracking-[0.3em]">
                            © 2026 ADVANCED SECURITY - SIMOC
                        </p>
                    </div>
                </div>
            </div>
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
                        <span className="text-xs font-black uppercase text-white tracking-widest">{loggedUser}</span>
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
                <section className="border border-[#152233] bg-[#0b1621]/60 backdrop-blur-md rounded-2xl p-8 shadow-2xl hud-corners relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-[#152233] pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px w-8 bg-[#00e5a0]" />
                                <span className="text-[9px] text-[#00e5a0] font-black uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(0,229,160,0.5)]">MANAGEMENT TERMINAL</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-md">
                                REGISTRO DE<br />
                                <span className="text-[#00e5a0]">GESTIÓN</span>
                            </h1>
                        </div>

                        <div className="flex bg-[#060d14] border border-[#152233] rounded-xl p-1 shadow-inner">
                            {TABS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => setArea(t)}
                                    className={cn(
                                        "px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                                        area === t ? "bg-[#00e5a0] text-[#060d14] shadow-[0_0_15px_rgba(0,229,160,0.4)]" : "text-[#608096] hover:text-white"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={enviarGestion} className="space-y-10">
                        {/* Gestiones Selectors */}
                        <div className="flex flex-col sm:flex-row border border-[#152233] bg-[#060d14] rounded-xl p-1 gap-1">
                            {GESTIONES.map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGestion(g)}
                                    className={cn(
                                        "flex-1 py-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all text-center",
                                        gestion === g ? "bg-[#0b1621] border border-[#00e5a0]/30 text-[#00e5a0] shadow-[inset_0_0_20px_rgba(0,229,160,0.1)]" : "text-[#608096] hover:text-white"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                                        
                                        <div className="grid grid-cols-5 gap-3">
                                            {evidencias.map((img, i) => (
                                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#00e5a0]/30 group">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setEvidencias(evidencias.filter((_, idx) => idx !== i))}
                                                        className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setEvidencias([...evidencias, reader.result as string]);
                                                                };
                                                                reader.readAsDataURL(file);
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
                        <div className="border border-dashed border-[#152233] rounded-xl flex items-center justify-center p-8 bg-[#060d14]/50 my-8">
                            {!tecnologia ? (
                                <p className="text-[9px] font-black text-[#608096] tracking-[0.2em] uppercase text-center">
                                    • SELECCIONE TECNOLOGÍA DE RED PARA ACTIVAR PLANTILLA DE {gestion} •
                                </p>
                            ) : (
                                <div className="w-full text-left">
                                    {gestion === "CIERRE" && tecnologia === "GPON" && <PlantillaRender titulo="Plantilla Cierre GPON" campos={plantillaCierreGPON} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "CIERRE" && tecnologia === "HFC" && <PlantillaRender titulo="Plantilla Cierre HFC" campos={plantillaCierreHFC} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "CIERRE" && tecnologia === "FIBRA" && <PlantillaRender titulo="Plantilla Cierre FIBRA" campos={plantillaCierreFIBRA} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "GPON" && <PlantillaRender titulo="Plantilla Enrutar GPON" campos={plantillaEnrutarGPON} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "HFC" && <PlantillaRender titulo="Plantilla Enrutar HFC" campos={plantillaEnrutarHFC} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    {gestion === "ENRUTAR" && tecnologia === "FIBRA" && <PlantillaRender titulo="Plantilla Enrutar FIBRA" campos={plantillaEnrutarFIBRA} formExtra={formExtra} setFormExtra={setFormExtra} numeroInc={incidente} nombreTecnico={loggedUser} />}
                                    
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
                <HistorialTable 
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
                <ChatWindow
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