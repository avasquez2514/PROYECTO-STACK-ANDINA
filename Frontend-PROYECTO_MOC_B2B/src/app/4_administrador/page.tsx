"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Users, BarChart3, Download, Clock, ShieldCheck,
    Settings, Search, Sun, Moon, Briefcase, Zap, Coffee, User, MoreVertical,
    Activity, ArrowUpRight, Filter, Database,
    FileSpreadsheet, ClipboardCheck, AlertTriangle,
    Plus, Edit2, Trash2, X, Check, ChevronRight, UserPlus, HardDrive, UserCheck,
    FileText, FileJson, History, Megaphone, BellRing
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const PERFILES_CONFIG: any = {
    "EN_CIERRES": { label: "Cierres", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    "SOLO_SOPORTES": { label: "Soporte", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    "TODO": { label: "Todo gestión", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" }
};

const ESTADOS_CONFIG: any = {
    "EN_GESTION": { label: "En gestión", color: "text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50" },
    "EN_DESCANSO": { label: "En descanso", color: "text-rose-500", dot: "bg-rose-500 shadow-rose-500/50" },
    "NO_DISPONIBLE": { label: "No disponible", color: "text-slate-500", dot: "bg-slate-500 shadow-slate-500/10" },
    "CASO_COMPLEJO": { label: "Caso complejo", color: "text-amber-500", dot: "bg-amber-500 shadow-amber-500/50" }
};

const StatusTimer = ({ lastChange }: { lastChange: string }) => {
    const [display, setDisplay] = useState("0s");

    useEffect(() => {
        const calculate = () => {
            if (!lastChange) return "0s";
            const diff = Math.floor((new Date().getTime() - new Date(lastChange).getTime()) / 1000);
            if (diff < 60) return `${diff}s`;
            if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
            return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
        };

        setDisplay(calculate());
        const timer = setInterval(() => setDisplay(calculate()), 1000);
        return () => clearInterval(timer);
    }, [lastChange]);

    return <span>{display}</span>;
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, asesores, funcionarios, soportes
    const [asesores, setAsesores] = useState<any[]>([]);
    const [gestiones, setGestiones] = useState<any[]>([]);
    const [funcionarios, setFuncionarios] = useState<any[]>([]);
    const [noticias, setNoticias] = useState<any[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState(false);
    const [credentials, setCredentials] = useState({ user: '', pass: '' });

    // Modal States
    const [modalConfig, setModalConfig] = useState<{
        type: 'asesor' | 'funcionario' | 'soporte' | 'asesor_history' | 'noticia',
        mode: 'add' | 'edit',
        data?: any
    } | null>(null);

    useEffect(() => {
        setHasMounted(true);
        const savedAuth = localStorage.getItem("admin_auth");
        if (savedAuth === "true") {
            setIsLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    const fetchData = async () => {
        try {
            const [resAsesores, resGestiones, resFuncs, resNoticias] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/asesores/"),
                fetch("http://127.0.0.1:8000/api/soporte/"),
                fetch("http://127.0.0.1:8000/api/funcionarios/"),
                fetch("http://127.0.0.1:8000/api/noticias/")
            ]);
            const [dataA, dataG, dataF, dataN] = await Promise.all([
                resAsesores.json(), resGestiones.json(), resFuncs.json(), resNoticias.json()
            ]);

            setAsesores(dataA);
            setGestiones(dataG.sort((a: any, b: any) => b.id - a.id));
            setFuncionarios(dataF);
            setNoticias(dataN.sort((a: any, b: any) => b.id - a.id));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Credenciales predefinidas (puedes cambiarlas según necesites)
        if (credentials.user === "admin" && credentials.pass === "admin123") {
            setIsLoggedIn(true);
            setLoginError(false);
            localStorage.setItem("admin_auth", "true");
        } else {
            setLoginError(true);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem("admin_auth");
    };

    const handleAction = async (type: string, action: 'POST' | 'PATCH' | 'DELETE', id?: number, data?: any) => {
        const url = `http://127.0.0.1:8000/api/${type}/${id ? id + '/' : ''}`;
        try {
            const res = await fetch(url, {
                method: action,
                headers: { "Content-Type": "application/json" },
                body: action !== 'DELETE' ? JSON.stringify(data) : undefined
            });
            if (res.ok) {
                fetchData();
                setModalConfig(null);
                alert(`${action === 'POST' ? 'REGISTRO CREADO' : 'CAMBIOS GUARDADOS'} EXITOSAMENTE`);
            } else {
                const errorData = await res.json();
                console.error(`Error in ${action} ${type}:`, errorData);
                alert(`ERROR AL PROCESAR: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error(`Error in ${action} ${type}:`, error);
            alert("ERROR DE CONEXIÓN CON EL SERVIDOR");
        }
    };

    const formatFechaString = (f: string) => {
        if (!f) return "---";
        try {
            const [datePart, rest] = f.split('T');
            const timePart = rest.split('-')[0].split('+')[0].split('.')[0];
            const [year, month, day] = datePart.split('-');
            let [hour, minute, second] = timePart.split(':');
            let h = parseInt(hour, 10);
            const ampm = h >= 12 ? 'p.m.' : 'a.m.';
            h = h % 12;
            h = h ? h : 12;
            return `${day}/${month}/${year} ${h.toString().padStart(2, '0')}:${minute} ${ampm}`;
        } catch { return f; }
    };

    const handleClearHistory = async (asesorId: number) => {
        if (!confirm("¿ESTÁ SEGURO DE VACIAR TODO EL HISTORIAL DE ESTE ASESOR? ESTA ACCIÓN NO SE PUEDE DESHACER.")) return;

        try {
            // Asumiendo que el backend soporta un DELETE masivo por query param o similar
            // Si no, podríamos iterar, pero lo ideal es un endpoint dedicado.
            // Ajustamos a la URL probable de eliminación masiva por asesor.
            const res = await fetch(`http://127.0.0.1:8000/api/asesor_history/?asesor=${asesorId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("HISTORIAL VACIADO EXITOSAMENTE");
                setModalConfig(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(`ERROR AL VACIAR: ${JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error("Error clearing history:", error);
            alert("ERROR DE CONEXIÓN CON EL SERVIDOR");
        }
    };

    const exportToExcel = () => {
        if (gestiones.length === 0) return;

        const dataParaExcel = gestiones.map(g => ({
            "FECHA Y HORA": formatFechaString(g.fecha_hora),
            "FUNCIONARIO": g.nombre,
            "CELULAR": g.celular || '---',
            "TORRE": g.torre || '---',
            "INCIDENTE": g.incidente || '---',
            "GESTION": g.gestion,
            "OBSERVACIONES": g.observaciones || '',
            "PLANTILLA_TECNICA": g.plantilla,
            "ASESOR_N1": g.login_n1 || 'SIN ASIGNAR',
            "ESTADO": g.estado
        }));

        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Gestiones");
        XLSX.writeFile(wb, `reporte_soporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    };


    const exportToPDF = () => {
        if (gestiones.length === 0) return;

        const doc = new jsPDF('landscape');

        // Configuración de cabecera
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text("REPORTE HISTÓRICO DE GESTIONES - PHOENIX MOC", 14, 22);

        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Fecha/Hora", "Funcionario", "Torre", "Incidente", "Gestión", "Obs.", "Asesor N1", "Estado"];
        const tableRows = gestiones.map(g => [
            new Date(g.fecha_hora).toLocaleString('es-CO'),
            g.nombre,
            g.torre || '---',
            g.incidente || '---',
            g.gestion,
            (g.observaciones || '').substring(0, 30) + (g.observaciones?.length > 30 ? '...' : ''),
            g.login_n1 || 'SIN ASIGNAR',
            g.estado
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: {
                5: { cellWidth: 40 } // Ancho para observaciones
            }
        });

        doc.save(`reporte_soporte_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToCSV = () => {
        if (gestiones.length === 0) return;
        const headers = ["ID", "Fecha/Hora", "Asesor", "Gestión", "Incidiente", "Estado", "Observaciones"];
        const rows = gestiones.map(g => [g.id, g.fecha_hora, g.nombre, g.gestion, g.incidente, g.estado, g.observaciones?.replace(/,/g, ';')]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `reporte_soporte_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const calculateTimeInStatus = (lastChange: string) => {
        if (!lastChange) return "0s";
        const diff = Math.floor((new Date().getTime() - new Date(lastChange).getTime()) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    };

    const formatSeconds = (seconds: number) => {
        if (!seconds && seconds !== 0) return "---";
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const getStatsPerAsesor = (login: string) => {
        const userGestiones = gestiones.filter(g => g.login_n1 === login || g.nombre === login);
        return {
            total: userGestiones.length,
            cierres: userGestiones.filter(g => g.gestion === "CIERRE").length,
            soportes: userGestiones.filter(g => g.gestion === "SOPORTE").length
        };
    };

    const totalStats = {
        total: gestiones.length,
        cierres: gestiones.filter(g => g.gestion === "CIERRE").length,
        pendientes: gestiones.filter(g => !g.login_n1 || g.login_n1 === "POR_ASIGNAR" || g.login_n1 === "").length,
        en_gestion: asesores.filter(a => a.estado === "EN_GESTION").length,
        en_descanso: asesores.filter(a => a.estado === "EN_DESCANSO").length
    };

    if (!hasMounted) return null;

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700">
                {/* Background Effects */}
                <div className="fixed inset-0 pointer-events-none opacity-30">
                    <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600 blur-[180px] rounded-full animate-pulse" />
                    <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600 blur-[180px] rounded-full animate-pulse" />
                </div>

                <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                    <div className="glass-panel p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10 group overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />

                        <div className="text-center space-y-3 relative">
                            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                                <ShieldCheck size={38} className="text-white" />
                            </div>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                                ACCESS <span className="text-blue-500">DENIED</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Administrator Terminal V1.0</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6 relative">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Authorized User</label>
                                <div className="relative group/input">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={credentials.user}
                                        onChange={(e) => {
                                            setCredentials(prev => ({ ...prev, user: e.target.value }));
                                            if (loginError) setLoginError(false);
                                        }}
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-slate-950/50 border rounded-3xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-800",
                                            loginError ? "border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/5 focus:border-blue-500/50"
                                        )}
                                        placeholder="USUARIO"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Access Key</label>
                                <div className="relative group/input">
                                    <Activity className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" />
                                    <input
                                        type="password"
                                        value={credentials.pass}
                                        onChange={(e) => {
                                            setCredentials(prev => ({ ...prev, pass: e.target.value }));
                                            if (loginError) setLoginError(false);
                                        }}
                                        className={cn(
                                            "w-full pl-16 pr-6 py-5 bg-slate-950/50 border rounded-3xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-800",
                                            loginError ? "border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/5 focus:border-blue-500/50"
                                        )}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {loginError && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4 animate-shake shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                    <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
                                        <AlertTriangle size={18} className="text-rose-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Acceso Denegado</span>
                                        <span className="text-[8px] font-bold text-rose-400/60 uppercase tracking-widest">Error de Autenticación</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 group/btn overflow-hidden relative"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    UNLOCK SYSTEM <ChevronRight size={16} />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                            </button>
                        </form>

                        <div className="pt-4 text-center">
                            <button className="text-[9px] font-black text-slate-600 hover:text-blue-500 transition-colors tracking-widest uppercase">Forgotten Credentials? Contact SysAdmin</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "min-h-screen relative transition-colors duration-500 overflow-hidden",
            theme === "light" ? "bg-slate-50 text-slate-900" : "bg-[#020617] text-slate-200"
        )}>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600 blur-[160px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600 blur-[160px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex h-screen overflow-hidden">
                {/* Lateral Sidebar Modern */}
                <aside className="w-80 border-r border-white/5 flex flex-col glass-panel shrink-0">
                    <div className="p-10 border-b border-white/5">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={24} /></div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase">Admin <span className="text-blue-500">MOC</span></h1>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Infrastructure Control</p>
                    </div>

                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                        {[
                            { id: "dashboard", label: "Dashboard Real-Time", icon: BarChart3 },
                            { id: "asesores", label: "Gestión de Asesores", icon: Users },
                            { id: "funcionarios", label: "Gestión de Funcionarios", icon: UserCheck },
                            { id: "historico_asesores", label: "Histórico de Asesores", icon: History },
                            { id: "soportes", label: "Histórico de Incidentes", icon: Database },
                            { id: "noticias", label: "Panel de Noticias", icon: Megaphone },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest",
                                    activeTab === tab.id
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1"
                                        : "hover:bg-white/5 text-slate-500"
                                )}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-8 border-t border-white/5 space-y-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-white/5 transition-all text-slate-500 hover:text-white"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/10"
                        >
                            <Trash2 size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
                    <header className="h-24 px-10 border-b border-white/5 flex items-center justify-between glass-panel">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                                {activeTab === 'dashboard' ? 'Panel de Control' : activeTab === 'asesores' ? 'Administrar Técnicos' : activeTab === 'funcionarios' ? 'Directorio Funcionarios' : activeTab === 'noticias' ? 'Gestión de Novedades' : 'Registro de Actividad'}
                            </h2>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black tracking-widest animate-pulse border border-blue-500/20 uppercase">Live Update</span>
                        </div>

                        <div className="flex items-center gap-6">
                            {(activeTab === 'asesores' || activeTab === 'funcionarios' || activeTab === 'noticias') && (
                                <button
                                    onClick={() => setModalConfig({ type: activeTab === 'noticias' ? 'noticia' : (activeTab === 'asesores' ? 'asesor' : 'funcionario'), mode: 'add' })}
                                    className="px-6 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} /> Agregar {activeTab === 'asesores' ? 'Asesor' : activeTab === 'funcionarios' ? 'Funcionario' : 'Novedad'}
                                </button>
                            )}
                            {(activeTab === 'soportes' || activeTab === 'dashboard') && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={exportToPDF}
                                        title="Exportar a PDF"
                                        className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-400 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                                    >
                                        <FileText size={20} />
                                    </button>
                                    <button
                                        onClick={exportToExcel}
                                        title="Exportar a Excel"
                                        className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <FileSpreadsheet size={20} />
                                    </button>
                                </div>
                            )}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="FILTRAR REGISTROS..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-12 pr-6 py-3 bg-slate-500/5 border border-white/5 rounded-2xl text-[10px] font-bold outline-none focus:border-blue-500/50 w-64 uppercase"
                                />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {/* --- TAB: DASHBOARD --- */}
                        {activeTab === "dashboard" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                                    {[
                                        { label: "GESTIONES TOTALES", value: totalStats.total, icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
                                        { label: "CIERRES EXITOSOS", value: totalStats.cierres, icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        { label: "PENDIENTES", value: totalStats.pendientes, icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
                                        { label: "EN GESTION", value: totalStats.en_gestion, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        { label: "EN DESCANSO", value: totalStats.en_descanso, icon: Coffee, color: "text-rose-500", bg: "bg-rose-500/10" }
                                    ].map((stat, i) => (
                                        <div key={i} className="glass-panel p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-2xl shadow-black/20">
                                            <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full -mr-12 -mt-12 transition-all duration-1000 group-hover:blur-[60px]", stat.bg)} />
                                            <div className="relative z-10">
                                                <div className={cn("p-4 rounded-2xl w-fit mb-4 shadow-lg", stat.bg, stat.color)}>
                                                    <stat.icon size={22} className="group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">{stat.label}</p>
                                                <p className="text-3xl font-black italic tracking-tighter text-white">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                                                    <Activity size={24} className="animate-pulse" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[14px] font-black uppercase italic tracking-wider text-white">Live Monitoring Unit</h3>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">Personal en Operación en Tiempo Real</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {Object.entries(ESTADOS_CONFIG).slice(0, 3).map(([key, cfg]: [string, any]) => (
                                                    <div key={key} className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5 shadow-inner">
                                                        <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">{asesores.filter(a => a.estado === key).length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {asesores.slice(0, 6).map((a) => {
                                                const stats = getStatsPerAsesor(a.login);
                                                const st = ESTADOS_CONFIG[a.estado] || ESTADOS_CONFIG.NO_DISPONIBLE;
                                                return (
                                                    <div key={a.id} className="glass-panel p-8 rounded-[3rem] border border-white/5 relative group hover:border-blue-500/20 transition-all overflow-hidden shadow-2xl">
                                                        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-all duration-1000", st.dot.split(' ')[0])} />

                                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <div className="w-16 h-16 rounded-[2rem] bg-slate-950 border border-white/10 flex items-center justify-center font-black text-blue-500 text-lg shadow-2xl overflow-hidden">
                                                                        {a.login.substring(0, 2).toUpperCase()}
                                                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent shadow-inner" />
                                                                    </div>
                                                                    <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#020617] flex items-center justify-center", st.dot)} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[15px] font-black uppercase text-white tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">{a.nombre_asesor}</h4>
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                                                        {a.login}
                                                                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                                        {PERFILES_CONFIG[a.perfil]?.label || a.perfil}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-[#060d14] p-5 rounded-[2.5rem] border border-white/5 space-y-5 relative z-10 shadow-inner">
                                                            <div className="flex justify-between items-center">
                                                                <div className={cn("px-4 py-2 rounded-xl flex items-center gap-3 border transition-all shadow-lg", st.color.replace('text', 'bg').replace('500', '500/10'), st.color.replace('text', 'border').replace('500', '500/20'))}>
                                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", st.color)}>{st.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-white/5 shadow-lg group/time">
                                                                    <Clock size={14} className="text-blue-500 group-hover/time:rotate-45 transition-transform" />
                                                                    <span className="text-[11px] font-mono font-black text-blue-400">
                                                                        <StatusTimer lastChange={a.ultimo_cambio_estado} />
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">
                                                                    <span>OPERATIONAL LOAD</span>
                                                                    <span>{stats.total} CASES</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-white/5 shadow-inner">
                                                                    <div style={{ width: `${(stats.cierres / (stats.total || 1)) * 100}%` }} className="bg-emerald-500 h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1000" />
                                                                    <div style={{ width: `${(stats.soportes / (stats.total || 1)) * 100}%` }} className="bg-blue-500 h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-1000" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Download className="text-emerald-500" size={18} /><h3 className="text-[12px] font-black uppercase italic tracking-wider">Centro de Reportes</h3></div>
                                        <div className="glass-panel p-10 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden shadow-2xl">
                                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full" />

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Actividad Reciente</h4>
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                                </div>
                                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                                    {gestiones.slice(0, 8).map((g, i) => (
                                                        <div key={i} className="p-5 bg-black/40 rounded-3xl border border-white/5 group hover:border-emerald-500/20 transition-all cursor-default shadow-inner">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded-lg tracking-tighter border border-emerald-500/10">{g.gestion}</span>
                                                                <span className="text-[8px] font-mono text-slate-600 font-bold">{new Date(g.fecha_hora).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-[12px] font-black uppercase truncate text-white tracking-widest leading-none mb-2">{g.nombre}</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                                <span className="text-[8px] font-black text-slate-500 uppercase italic tracking-widest">INF ID: #{g.incidente || '---'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-white/5 relative z-10">
                                                <button onClick={exportToExcel} className="w-full py-5 bg-emerald-600/10 border border-emerald-600/20 rounded-[2rem] text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-emerald-500/5">
                                                    <FileSpreadsheet size={16} className="group-hover/btn:scale-110 transition-transform" /> Exportar base Excel (XLSX)
                                                </button>
                                                <button onClick={exportToPDF} className="w-full py-5 bg-rose-600/10 border border-rose-600/20 rounded-[2rem] text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-600/20 transition-all flex items-center justify-center gap-3 group/btn shadow-xl shadow-rose-500/5">
                                                    <FileText size={16} className="group-hover/btn:scale-110 transition-transform" /> Generar Reporte PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- TAB: HISTÓRICO DE ASESORES (MONITOREO) --- */}
                        {activeTab === "historico_asesores" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar pr-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {asesores.map((a) => (
                                        <div key={a.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className="w-14 h-14 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all font-black text-lg">
                                                    {a.login.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-sm uppercase text-white mb-1">{a.nombre_asesor}</h3>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">{a.perfil}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 bg-slate-950/40 p-5 rounded-3xl border border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado Actual</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", ESTADOS_CONFIG[a.estado]?.dot)} />
                                                        <span className={cn("text-[10px] font-black uppercase", ESTADOS_CONFIG[a.estado]?.color)}>
                                                            {ESTADOS_CONFIG[a.estado]?.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tiempo Acumulado</span>
                                                    <div className="flex items-center gap-2 text-emerald-500">
                                                        <Clock size={12} />
                                                        <span className="text-xs font-mono font-black border-b border-emerald-500/20"><StatusTimer lastChange={a.ultimo_cambio_estado} /></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setModalConfig({ type: 'asesor_history', mode: 'edit', data: a })}
                                                className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                            >
                                                <History size={16} />
                                                Ver Historial Detallado
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ASESORES (MANAGEMENT) --- */}
                        {activeTab === "asesores" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#060d14] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5 shadow-xl">
                                            <tr>
                                                <th className="px-10 py-7">ID</th>
                                                <th className="px-10 py-7">NOMBRES Y APELLIDOS</th>
                                                <th className="px-10 py-7">ACCESO / ID</th>
                                                <th className="px-10 py-7">PERFIL ASIGNADO</th>
                                                <th className="px-10 py-7">ESTADO ACTUAL</th>
                                                <th className="px-10 py-7 text-center">GESTIÓN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold">
                                            {asesores.filter(a => !busqueda || a.nombre_asesor.toUpperCase().includes(busqueda.toUpperCase()) || a.cedula.includes(busqueda)).map((a) => (
                                                <tr key={a.id} className="border-t border-white/5 hover:bg-blue-600/[0.03] transition-all group relative">
                                                    <td className="px-8 py-5 text-slate-500 font-mono">#{a.id}</td>
                                                    <td className="px-8 py-5 uppercase font-black">{a.nombre_asesor}</td>
                                                    <td className="px-8 py-5 uppercase tracking-tighter">
                                                        <div className="flex flex-col"><span>{a.login}</span><span className="text-[8px] opacity-50">{a.cedula}</span></div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase border animate-blink", PERFILES_CONFIG[a.perfil]?.bg, PERFILES_CONFIG[a.perfil]?.color, PERFILES_CONFIG[a.perfil]?.border)}>
                                                            {PERFILES_CONFIG[a.perfil]?.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", ESTADOS_CONFIG[a.estado]?.dot)} />
                                                                <span className="uppercase text-[9px] font-black">{ESTADOS_CONFIG[a.estado]?.label}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1">
                                                                <Clock size={10} className="text-slate-500" />
                                                                <span className="text-[8px] font-mono text-slate-400"><StatusTimer lastChange={a.ultimo_cambio_estado} /></span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button onClick={() => setModalConfig({ type: 'asesor_history', mode: 'edit', data: a })} className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all" title="Ver Historial de Estados"><History size={16} /></button>
                                                            <button onClick={() => setModalConfig({ type: 'asesor', mode: 'edit', data: a })} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                                                            <button onClick={() => { if (confirm('¿ELIMINAR ASESOR?')) handleAction('asesores', 'DELETE', a.id) }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: FUNCIONARIOS --- */}
                        {activeTab === "funcionarios" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-500/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <tr>
                                                <th className="px-8 py-6">ID</th>
                                                <th className="px-8 py-6">NOMBRE COMPLETO</th>
                                                <th className="px-8 py-6">CÉDULA CIUDADANÍA</th>
                                                <th className="px-8 py-6">CELULAR CONTACTO</th>
                                                <th className="px-8 py-6">CONTRASEÑA</th>
                                                <th className="px-8 py-6 text-center">ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold">
                                            {funcionarios.filter(f => !busqueda || f.nombre_funcionario.toUpperCase().includes(busqueda.toUpperCase())).map((f) => (
                                                <tr key={f.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-5 text-slate-500 font-mono">#{f.id}</td>
                                                    <td className="px-8 py-5 uppercase font-black">{f.nombre_funcionario}</td>
                                                    <td className="px-8 py-5 text-blue-500">{f.cedula}</td>
                                                    <td className="px-8 py-5">{f.celular || '---'}</td>
                                                    <td className="px-8 py-5 text-emerald-500 font-mono italic">{f.password || '---'}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <button onClick={() => setModalConfig({ type: 'funcionario', mode: 'edit', data: f })} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16} /></button>
                                                            <button onClick={() => { if (confirm('¿ELIMINAR FUNCIONARIO?')) handleAction('funcionarios', 'DELETE', f.id) }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: NOTICIAS --- */}
                        {activeTab === "noticias" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {noticias.map((n) => (
                                        <div key={n.id} className={cn(
                                            "glass-panel p-10 rounded-[3rem] border transition-all relative group overflow-hidden",
                                            n.activa ? "border-amber-500/30 shadow-[0_20px_40px_rgba(245,158,11,0.1)]" : "border-white/5 opacity-60"
                                        )}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-4 rounded-3xl", n.activa ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500")}>
                                                        <BellRing size={24} />
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Publicado en: {new Date(n.fecha_publicacion).toLocaleDateString()}</span>
                                                        <h4 className="text-lg font-black uppercase text-white leading-tight mt-1 truncate max-w-[200px]">{n.contenido}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", n.activa ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-white/10")}>
                                                        {n.activa ? "VISIBLE" : "OCULTA"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 h-20 overflow-hidden line-clamp-3 italic uppercase font-black">
                                                {n.contenido}
                                            </p>

                                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                <div className="flex gap-4">
                                                    <button onClick={() => setModalConfig({ type: 'noticia', mode: 'edit', data: n })} className="p-3 text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"><Edit2 size={18} /></button>
                                                    <button onClick={() => { if (confirm('¿ELIMINAR NOVEDAD?')) handleAction('noticias', 'DELETE', n.id) }} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"><Trash2 size={18} /></button>
                                                </div>
                                                <button
                                                    onClick={() => handleAction('noticias', 'PATCH', n.id, { activa: !n.activa })}
                                                    className={cn(
                                                        "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        n.activa ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                                                    )}
                                                >
                                                    {n.activa ? "Desactivar" : "Activar Ahora"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {noticias.length === 0 && (
                                        <div className="col-span-2 py-20 text-center glass-panel rounded-[3rem] border border-white/5">
                                            <Megaphone size={48} className="mx-auto text-slate-700 mb-6 opacity-20" />
                                            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">No hay noticias registradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: SOPORTES (LOGBOOK) --- */}
                        {activeTab === "soportes" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden max-h-[800px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[1200px]">
                                        <thead className="sticky top-0 bg-slate-900 z-20 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-xl">
                                            <tr>
                                                <th className="px-8 py-6">FECHA/HORA</th>
                                                <th className="px-8 py-6">FUNCIONARIO</th>
                                                <th className="px-8 py-6">CELULAR</th>
                                                <th className="px-8 py-6">TORRE</th>
                                                <th className="px-8 py-6">INCIDENTE</th>
                                                <th className="px-8 py-6">GESTION</th>
                                                <th className="px-8 py-6">OBSERVACIONES</th>
                                                <th className="px-8 py-6">PLANTILLA</th>
                                                <th className="px-8 py-6">ASESOR N1</th>
                                                <th className="px-8 py-6">ESTADO</th>
                                                <th className="px-8 py-6 text-center">ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold">
                                            {gestiones.filter(g => !busqueda || g.incidente?.includes(busqueda) || g.nombre?.toUpperCase().includes(busqueda.toUpperCase())).map((g) => (
                                                <tr key={g.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-5 text-slate-500 font-mono whitespace-nowrap">{formatFechaString(g.fecha_hora)}</td>
                                                    <td className="px-8 py-5 uppercase font-black">{g.nombre}</td>
                                                    <td className="px-8 py-5 text-slate-400">{g.celular || '---'}</td>
                                                    <td className="px-8 py-5 text-[9px] uppercase font-bold text-slate-500">{g.torre}</td>
                                                    <td className="px-8 py-5 text-amber-500 font-black font-mono">{g.incidente || '---'}</td>
                                                    <td className="px-8 py-5">
                                                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-[6px] text-[8px] font-black uppercase border border-blue-500/20">{g.gestion}</span>
                                                    </td>
                                                    <td className="px-8 py-5 max-w-[200px] truncate block mt-4" title={g.observaciones}>{g.observaciones}</td>
                                                    <td className="px-8 py-5">
                                                        <button
                                                            onClick={() => setModalConfig({ type: 'soporte', mode: 'edit', data: g })}
                                                            className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all border border-blue-500/10 shadow-lg shadow-blue-500/5 group/view"
                                                            title="Ver Detalle Completo"
                                                        >
                                                            <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-widest">
                                                                <ArrowUpRight size={14} className="group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5 transition-transform" />
                                                                <span>Ver Detalle</span>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 uppercase font-black text-slate-400">{g.login_n1 || 'SIN ASIGNAR'}</td>
                                                    <td className="px-8 py-5">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-[6px] text-[8px] font-black uppercase",
                                                            g.estado === "Resuelto" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                                g.estado === "Enrutado" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                                                    "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                                        )}>
                                                            {g.estado}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <button onClick={() => setModalConfig({ type: 'soporte', mode: 'edit', data: g })} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                                                            <button onClick={() => { if (confirm('¿ELIMINAR REGISTRO?')) handleAction('soporte', 'DELETE', g.id) }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* --- MODAL PARA GESTIÓN (ADD/EDIT) --- */}
            {modalConfig && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
                    <div className="glass-panel w-full max-w-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative">
                        <button onClick={() => setModalConfig(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all"><X size={24} /></button>

                        <div className="p-10 border-b border-white/5 space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                                {modalConfig.mode === 'add' ? 'Registrar Nuevo' : 'Editar Datos de'} {modalConfig.type}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Completa la información técnica para el backend</p>
                        </div>

                        <form className="p-10 space-y-8" onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const fd = new FormData(form);
                            const data = Object.fromEntries(fd.entries());
                            if (modalConfig.type === 'asesor_history') return; // History modal is read-only for form
                            handleAction(
                                modalConfig.type === 'asesor' ? 'asesores' :
                                    modalConfig.type === 'funcionario' ? 'funcionarios' : 'noticias',
                                modalConfig.mode === 'add' ? 'POST' : 'PATCH',
                                modalConfig.data?.id,
                                data
                            );
                        }}>
                            <div className="grid grid-cols-2 gap-8">
                                {modalConfig.type === 'asesor_history' ? (
                                    <div className="col-span-2 space-y-6">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black">{modalConfig.data?.login?.substring(0, 2).toUpperCase()}</div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase text-white">{modalConfig.data?.nombre_asesor}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{modalConfig.data?.login}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Estado Actual</p>
                                                    <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase", ESTADOS_CONFIG[modalConfig.data?.estado]?.color.replace('text', 'bg').replace('500', '500/20'), ESTADOS_CONFIG[modalConfig.data?.estado]?.color)}>
                                                        {ESTADOS_CONFIG[modalConfig.data?.estado]?.label}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearHistory(modalConfig.data?.id)}
                                                    className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-2xl transition-all flex items-center gap-2 group shadow-lg shadow-rose-500/5 group-hover:scale-105 active:scale-95"
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Vaciar Historial</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] overflow-hidden">
                                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left">
                                                    <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500 sticky top-0">
                                                        <tr>
                                                            <th className="px-6 py-4">ESTADO</th>
                                                            <th className="px-6 py-4">INICIO</th>
                                                            <th className="px-6 py-4">FIN</th>
                                                            <th className="px-6 py-4 text-right">DURACIÓN</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-[10px] font-bold divide-y divide-white/5">
                                                        {modalConfig.data?.historial_estados?.length > 0 ? (
                                                            modalConfig.data.historial_estados.map((h: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-white/[0.02] transition-all">
                                                                    <td className="px-6 py-4">
                                                                        <span className={cn("uppercase", ESTADOS_CONFIG[h.estado]?.color)}>
                                                                            {ESTADOS_CONFIG[h.estado]?.label || h.estado}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-slate-400">{new Date(h.fecha_inicio).toLocaleString()}</td>
                                                                    <td className="px-6 py-4 text-slate-500">{h.fecha_fin ? new Date(h.fecha_fin).toLocaleString() : <span className="text-emerald-500 animate-pulse">ACTIVO</span>}</td>
                                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">
                                                                        {h.duracion_segundos ? formatSeconds(h.duracion_segundos) : <StatusTimer lastChange={h.fecha_inicio} />}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-600 italic uppercase text-[9px] tracking-widest font-black">No hay registros previos en el historial</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ) : modalConfig.type === 'asesor' ? (
                                    <>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre Completo</label>
                                            <input name="nombre_asesor" defaultValue={modalConfig.data?.nombre_asesor} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50" required placeholder="EJ: JUAN PEREZ" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Cédula</label>
                                            <input name="cedula" defaultValue={modalConfig.data?.cedula} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50" required placeholder="1010..." />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Login / Usuario</label>
                                            <input name="login" defaultValue={modalConfig.data?.login} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50" required placeholder="USER_N1" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Perfil de Asistencia</label>
                                            <select name="perfil" defaultValue={modalConfig.data?.perfil || 'TODO'} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none">
                                                {Object.entries(PERFILES_CONFIG).map(([v, c]: any) => <option key={v} value={v}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Estado Actual</label>
                                            <select name="estado" defaultValue={modalConfig.data?.estado || 'NO_DISPONIBLE'} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none">
                                                {Object.entries(ESTADOS_CONFIG).map(([v, c]: any) => <option key={v} value={v}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4 col-span-2">
                                            <label className="text-[9px] font-black text-emerald-500 uppercase px-1 tracking-widest">Contraseña de Acceso (Técnico)</label>
                                            <input name="password" defaultValue={modalConfig.data?.password} className="w-full bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500/50" required placeholder="CLAVE123" />
                                        </div>
                                    </>
                                ) : modalConfig.type === 'funcionario' ? (
                                    <>
                                        <div className="space-y-4 col-span-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre del Funcionario</label>
                                            <input name="nombre" defaultValue={modalConfig.data?.nombre || modalConfig.data?.nombre_funcionario} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50" required />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Cédula</label>
                                            <input name="cedula" defaultValue={modalConfig.data?.cedula} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50" required />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Celular</label>
                                            <input name="celular" defaultValue={modalConfig.data?.celular} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50" placeholder="300..." />
                                        </div>
                                        <div className="space-y-4 col-span-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest text-[#00e5a0]">Contraseña de Acceso</label>
                                            <input name="password" defaultValue={modalConfig.data?.password} className="w-full bg-[#00e5a0]/5 border border-[#00e5a0]/20 p-5 rounded-2xl text-xs font-black outline-none focus:border-[#00e5a0]/50 text-[#00e5a0]" placeholder="ACCESO_TEC" />
                                        </div>
                                    </>
                                ) : modalConfig.type === 'noticia' ? (
                                    <>
                                        <div className="col-span-2 space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Novedad / Anuncio (Máx. 500 carac.)</label>
                                            <textarea
                                                name="contenido"
                                                defaultValue={modalConfig.data?.contenido}
                                                className="w-full bg-slate-500/5 border border-white/10 p-6 rounded-3xl text-sm font-black uppercase outline-none focus:border-amber-500/50 h-40 resize-none leading-relaxed"
                                                required
                                                placeholder="Ej: Estimados técnicos, favor reportar incidencias de internet..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-4 col-span-2">
                                            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                                                <input
                                                    type="checkbox"
                                                    name="activa"
                                                    id="activa_news"
                                                    defaultChecked={modalConfig.mode === 'add' ? true : modalConfig.data?.activa}
                                                    className="w-5 h-5 rounded border-white/10 bg-slate-900 text-amber-500"
                                                />
                                                <label htmlFor="activa_news" className="text-[10px] font-black uppercase text-white cursor-pointer select-none">Mostrar inmediatamente al soporte y despacho</label>
                                            </div>
                                        </div>
                                    </>
                                ) : modalConfig.type === 'soporte' ? (
                                    <div className="col-span-2 space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 shadow-xl">
                                                <div className="flex items-center gap-3 mb-4 text-emerald-500">
                                                    <Clock size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Timestamp</span>
                                                </div>
                                                <p className="text-sm font-mono font-black text-white">{new Date(modalConfig.data?.fecha_hora).toLocaleString('es-CO')}</p>
                                            </div>
                                            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 shadow-xl">
                                                <div className="flex items-center gap-3 mb-4 text-amber-500">
                                                    <ShieldCheck size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Radicado Incident</span>
                                                </div>
                                                <p className="text-sm font-mono font-black text-white italic">#{modalConfig.data?.incidente || '---'}</p>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner space-y-6">
                                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500"><User size={20} /></div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información del Funcionario</h4>
                                                    <p className="text-lg font-black uppercase text-white tracking-tighter italic leading-none">{modalConfig.data?.nombre}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8 px-2">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Celular Reportado</span>
                                                    <span className="text-xs font-black text-blue-400">{modalConfig.data?.celular || '---'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Ubicación / Torre</span>
                                                    <span className="text-xs font-black text-white uppercase">{modalConfig.data?.torre || '---'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Procedimiento / Gestión Realizada</span>
                                                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black uppercase border border-blue-500/20">{modalConfig.data?.gestion}</span>
                                            </div>
                                            <div className="p-8 bg-slate-500/5 rounded-[2.5rem] border border-white/5 italic text-slate-300 text-sm font-serif leading-relaxed shadow-lg">
                                                "{modalConfig.data?.observaciones || 'Sin observaciones registradas.'}"
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <span className="text-[10px] font-black text-amber-500 uppercase px-2 tracking-widest flex items-center gap-2 italic">
                                                <FileJson size={14} /> Plantilla Técnica Enviada:
                                            </span>
                                            <pre className="p-8 bg-slate-950 rounded-[2rem] border border-white/5 text-[10px] font-mono text-emerald-400 shadow-2xl overflow-x-auto custom-scrollbar">
                                                {(() => {
                                                    try {
                                                        const p = JSON.parse(modalConfig.data?.plantilla);
                                                        return JSON.stringify(p, null, 4);
                                                    } catch (e) {
                                                        return modalConfig.data?.plantilla;
                                                    }
                                                })()}
                                            </pre>
                                        </div>

                                        <div className="flex items-center justify-between p-6 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 border-dashed">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500"><ShieldCheck size={14} /></div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Asesor Atendente</span>
                                            </div>
                                            <span className="text-xs font-black text-blue-400 uppercase italic tracking-tighter leading-none">{modalConfig.data?.login_n1 || '---'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Número INC</label>
                                            <input name="incidente" defaultValue={modalConfig.data?.incidente} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none" placeholder="INC000..." />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Gestión</label>
                                            <select name="gestion" defaultValue={modalConfig.data?.gestion} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none">
                                                <option value="SOPORTE">SOPORTE</option>
                                                <option value="CIERRE">CIERRE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Estado</label>
                                            <select name="estado" defaultValue={modalConfig.data?.estado} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none">
                                                <option value="En gestión">En gestión</option>
                                                <option value="Resuelto">Resuelto</option>
                                                <option value="Enrutado">Enrutado</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Login Asignado (N1)</label>
                                            <select name="login_n1" defaultValue={modalConfig.data?.login_n1} className="w-full bg-slate-800 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none">
                                                {asesores.map(a => <option key={a.id} value={a.login}>{a.login}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Torre</label>
                                            <input name="torre" defaultValue={modalConfig.data?.torre} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none" />
                                        </div>
                                        <div className="space-y-4 col-span-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Observaciones</label>
                                            <textarea name="observaciones" defaultValue={modalConfig.data?.observaciones} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none h-24" />
                                        </div>
                                    </>
                                )}
                            </div>

                            {modalConfig.type !== 'soporte' && modalConfig.type !== 'asesor_history' && (
                                <button type="submit" className="w-full py-6 bg-blue-600 shadow-xl shadow-blue-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                                    <Check size={18} /> {modalConfig.mode === 'add' ? 'Confirmar Registro' : 'Guardar Cambios'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .glass-panel {
                    background: ${theme === 'dark' ? 'rgba(15, 17, 26, 0.7)' : 'rgba(255, 255, 255, 0.8)'};
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
