"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Users, BarChart3, Download, Clock, ShieldCheck,
    Settings, Search, Sun, Moon, Briefcase, Zap, Coffee, User, MoreVertical,
    Activity, ArrowUpRight, Filter, Database,
    FileSpreadsheet, ClipboardCheck, AlertTriangle,
    Plus, Edit2, Trash2, X, Check, ChevronRight, UserPlus, HardDrive, UserCheck,
    FileText, FileJson, History, Megaphone, BellRing, ClipboardList, Shield, Maximize,
    Folder, CheckCircle2, Hourglass, ArrowDown
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Skeleton from "../components/Skeleton";
import FullscreenButton from "../components/FullscreenButton";

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
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    const router = useRouter();

    // Modal States
    const [modalConfig, setModalConfig] = useState<{
        type: 'asesor' | 'funcionario' | 'soporte' | 'asesor_history' | 'noticia',
        mode: 'add' | 'edit',
        data?: any
    } | null>(null);

    useEffect(() => {
        setHasMounted(true);
        const token = Cookies.get("accessToken");
        if (!token) {
            router.push("/login");
        }
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();

            const socket = new WebSocket("ws://127.0.0.1:8000/ws/updates/");
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                fetchData(); // Simplificado: recargar todo cuando hay cambios
            };

            return () => socket.close();
        }
    }, [isLoggedIn]);

    const fetchData = async () => {
        const token = Cookies.get("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const headers = { "Authorization": `Bearer ${token}` };
            const [resAsesores, resGestiones, resFuncs, resNoticias, resAudit] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/asesores/", { headers }),
                fetch("http://127.0.0.1:8000/api/soporte/", { headers }),
                fetch("http://127.0.0.1:8000/api/funcionarios/", { headers }),
                fetch("http://127.0.0.1:8000/api/noticias/", { headers }),
                fetch("http://127.0.0.1:8000/api/audit-logs/", { headers })
            ]);

            if (resAsesores.status === 401) {
                router.push("/login");
                return;
            }

            const [dataA, dataG, dataF, dataN, dataAudit] = await Promise.all([
                resAsesores.json(), resGestiones.json(), resFuncs.json(), resNoticias.json(), resAudit.json()
            ]);

            setAsesores(dataA);
            setGestiones(dataG.sort((a: any, b: any) => b.id - a.id));
            setFuncionarios(dataF);
            setNoticias(dataN.sort((a: any, b: any) => b.id - a.id));
            setAuditLogs(dataAudit);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    const handleLogout = () => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("adminUser");
        router.push("/login");
    };

    const handleAction = async (type: string, action: 'POST' | 'PATCH' | 'DELETE', id?: number, data?: any) => {
        const token = Cookies.get("accessToken");
        const user = Cookies.get("adminUser") || 'ADMIN';
        const url = `http://127.0.0.1:8000/api/${type}/${id ? id + '/' : ''}${action === 'DELETE' ? `?admin_user=${user}` : ''}`;

        try {
            const body = action !== 'DELETE' ? JSON.stringify({ ...data, admin_user: user }) : undefined;
            const res = await fetch(url, {
                method: action,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body
            });
            if (res.ok) {
                fetchData();
                setModalConfig(null);
                toast.success(`${action === 'POST' ? 'REGISTRO CREADO' : 'CAMBIOS GUARDADOS'} EXITOSAMENTE`);
            } else {
                const errorData = await res.json();
                console.error(`Error in ${action} ${type}:`, errorData);
                toast.error(`ERROR AL PROCESAR: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error(`Error in ${action} ${type}:`, error);
            toast.error("ERROR DE CONEXIÓN CON EL SERVIDOR");
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
            const res = await fetch(`http://127.0.0.1:8000/api/asesores/${asesorId}/clear_history/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_user: Cookies.get("adminUser") || 'AVASQUEZ' })
            });

            if (res.ok) {
                toast.success("HISTORIAL VACIADO EXITOSAMENTE");
                setModalConfig(null);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(`ERROR AL VACIAR: ${JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error("Error clearing history:", error);
            toast.error("ERROR DE CONEXIÓN CON EL SERVIDOR");
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
        en_descanso: asesores.filter(a => a.estado === "EN_DESCANSO").length,
        resueltos: gestiones.filter(g => g.estado === "Resuelto" || g.estado === "ACTIVO").length,
        enrutados: gestiones.filter(g => g.estado === "Enrutado").length
    };

    const dashboardStats = [
        { label: "CASOS TOTALES", value: totalStats.total, icon: "📁", isEmoji: true, color: "text-blue-500", glow: "rgba(59, 130, 246, 0.4)" },
        { label: "CASOS RESUELTOS", value: totalStats.resueltos, icon: "✅", isEmoji: true, color: "text-emerald-500", glow: "rgba(16, 185, 129, 0.4)" },
        { label: "CASOS ENRUTADOS", value: totalStats.enrutados, icon: "⚠️", isEmoji: true, color: "text-orange-500", glow: "rgba(249, 115, 22, 0.4)" },
        { label: "EN ESPERA", value: totalStats.pendientes, icon: "⏳", isEmoji: true, color: "text-rose-500", glow: "rgba(244, 63, 94, 0.4)" }
    ];

    return (
        <div className={cn(
            "min-h-screen relative transition-colors duration-500 overflow-hidden",
            theme === "light" ? "bg-[#F3F4F6] text-slate-800" : "bg-[#020810] text-slate-200"
        )}>
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-0">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600 blur-[160px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600 blur-[160px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex h-screen overflow-hidden">
                {/* Lateral Sidebar Modern */}
                <aside className="w-[280px] flex flex-col bg-[#040912] text-slate-300 shrink-0 z-20 shadow-xl shadow-black/10">
                    <div className="p-8">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                                <Shield size={24} fill="white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">ADMIN<span className="text-blue-400">MOC</span></h1>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 leading-none">Infrastructure Control</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        {[
                            { id: "dashboard", label: "Dashboard Real-Time", icon: BarChart3 },
                            { id: "asesores", label: "Gestión de Asesores", icon: Users },
                            { id: "funcionarios", label: "Gestión Funcionarios", icon: UserCheck },
                            { id: "historico_asesores", label: "Histórico de Asesores", icon: History },
                            { id: "soportes", label: "Histórico de Incidentes", icon: Database },
                            { id: "noticias", label: "Panel de Noticias", icon: Megaphone },
                            { id: "audit_logs", label: "Bitácora de Auditoría", icon: ClipboardList },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest",
                                    activeTab === tab.id
                                        ? "bg-blue-600 text-white shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]"
                                        : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                )}
                            >
                                <tab.icon size={18} className={cn(activeTab === tab.id ? "text-white" : "text-slate-500 group-hover:text-slate-200")} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="p-6 space-y-4">
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl hover:bg-white/5 transition-all text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 bg-[#1a0a0d] border border-rose-900/30 rounded-full text-rose-500 hover:bg-rose-900/20 transition-all text-[11px] font-black uppercase tracking-widest"
                        >
                            <Trash2 size={18} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
                    <header className="h-20 px-8 flex items-center justify-between bg-[#040912] border-b border-white/5 z-20 shadow-2xl shrink-0 overflow-hidden">
                        <div className="flex items-center gap-6 shrink-0">
                            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                                <Shield size={22} className="text-blue-500" />
                                <h1 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none">ADMIN<span className="text-blue-400">MOC</span></h1>
                            </div>
                            <div className="flex items-center gap-4">
                                <h2 className="text-[17px] font-black italic tracking-tight text-white uppercase leading-none whitespace-nowrap">
                                    {activeTab === 'dashboard' ? 'Panel de Control' : activeTab === 'asesores' ? 'Gestión de Asesores' : activeTab === 'funcionarios' ? 'Gestión de Funcionarios' : activeTab === 'noticias' ? 'Gestión de Novedades' : 'Registro de Auditoría'}
                                </h2>
                                <div className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-600/20 rounded-full shrink-0">
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Live Update</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5 shrink-0">
                            {hasMounted && (activeTab === 'asesores' || activeTab === 'funcionarios' || activeTab === 'noticias') && (
                                <button
                                    onClick={() => setModalConfig({ type: activeTab === 'noticias' ? 'noticia' : (activeTab === 'asesores' ? 'asesor' : 'funcionario'), mode: 'add' })}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} /> ADD NEW {activeTab === 'asesores' ? 'AGENT' : activeTab === 'funcionarios' ? 'OFFICIAL' : 'NEWS'}
                                </button>
                            )}

                            <div className="relative hidden xl:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="FILTRAR REGISTROS..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-10 pr-6 py-2.5 bg-[#06080F] border border-white/5 rounded-full text-[10px] font-bold tracking-widest w-40 text-white placeholder-slate-600 focus:w-60 transition-all outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 px-4 border-l border-r border-white/10 shrink-0">
                                <button onClick={exportToPDF} className="w-9 h-9 bg-[#FF2D55] text-white rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                    <FileText size={18} />
                                </button>
                                <button onClick={exportToExcel} className="w-9 h-9 bg-[#00C38A] text-white rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                                    <FileSpreadsheet size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 pl-4 shrink-0 border-l border-white/10">
                                <FullscreenButton />
                                <div className="text-right hidden lg:block">
                                    <p className="text-[10px] font-black text-white uppercase leading-none">Admin User</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">Online</p>
                                </div>
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-black text-white text-xs border-2 border-white/10 shadow-lg">
                                    AD
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {/* --- TAB: DASHBOARD --- */}
                        {activeTab === "dashboard" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <Skeleton key={i} className="h-40 rounded-[2.5rem]" />
                                        ))
                                    ) : (
                                        dashboardStats.map((stat, i) => (
                                            <div key={i} className={cn(
                                                "glass-panel p-6 relative flex flex-col items-start transition-all hover:-translate-y-1 mb-2 border-t-[3px]",
                                                stat.color.replace('text-', 'border-').replace('400', '500').replace('500', '600')
                                            )}>
                                                <div className="mb-6 flex items-center justify-center w-8 h-8 rounded-lg overflow-visible">
                                                    <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${stat.glow})` }}>{stat.icon}</span>
                                                </div>
                                                <div className="flex flex-col mb-4 gap-0.5">
                                                    {stat.label.split(' ').map((line, idx) => (
                                                        <span key={idx} className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{line}</span>
                                                    ))}
                                                </div>
                                                <p className={cn("text-[40px] font-black font-mono leading-none tracking-tighter mt-auto slashed-zero w-full", theme === 'light' ? 'text-slate-800' : 'text-white')}>{stat.value}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <div className="flex flex-col">
                                                    <h3 className={cn("text-xs font-black uppercase tracking-[0.2em]", theme === 'light' ? 'text-slate-800' : 'text-slate-100')}>LIVE MONITORING UNIT</h3>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PERSONAL EN OPERACIÓN EN TIEMPO REAL</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                {Object.entries(ESTADOS_CONFIG).slice(0, 3).map(([key, cfg]: [string, any]) => (
                                                    <div key={key} className={cn("flex items-center gap-2.5 px-3 py-1 rounded-full border border-white/10 shadow-inner", theme === 'light' ? 'bg-white' : 'bg-[#09101A]')}>
                                                        <div className={cn("w-2 h-2 rounded-full", cfg.dot.split(' ')[0])} />
                                                        <span className={cn("text-[9px] font-black", theme === 'light' ? 'text-slate-800' : 'text-slate-500')}>{asesores.filter(a => a.estado === key).length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>



                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {asesores.slice(0, 6).map((a) => {
                                                const stats = getStatsPerAsesor(a.login);
                                                const st = ESTADOS_CONFIG[a.estado] || ESTADOS_CONFIG.NO_DISPONIBLE;
                                                const isLight = theme === 'light';

                                                return (
                                                    <div key={a.id} className={cn(
                                                        "glass-panel p-5 relative overflow-hidden transition-all group flex flex-col justify-between min-h-[140px] rounded-xl border-l-[3px] shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]",
                                                        st.color.replace('text-', 'border-l-'),
                                                        a.estado === 'EN_GESTION' ? 'shadow-[0_0_20px_rgba(0,229,160,0.05)] border-l-[#00e5a0]' : ''
                                                    )}>
                                                        <div className="flex items-start justify-between gap-4 w-full">
                                                            <div className="flex gap-4">
                                                                <div className="relative shrink-0">
                                                                    <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-lg", isLight ? 'bg-blue-600/10 text-blue-600' : 'bg-[#1e2e47] text-blue-400')}>
                                                                        {a.login.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px]", isLight ? 'border-white' : 'border-[#1E293B]', st.dot.split('shadow')[0].trim())} />
                                                                </div>
                                                                <div className="flex flex-col pt-0.5">
                                                                    <h4 className={cn("text-[13px] font-black leading-tight tracking-tight", isLight ? 'text-slate-800' : 'text-white')}>{a.nombre_asesor}</h4>
                                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{a.login} - {a.perfil}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0 pt-0.5">
                                                                <div className="flex items-center gap-1.5 justify-end mb-1 text-slate-400 font-bold">
                                                                    <Clock size={12} className="opacity-70" />
                                                                    <span className={cn("text-[11px] font-mono", isLight ? 'text-blue-600' : 'text-[#4ea8de]')}><StatusTimer lastChange={a.ultimo_cambio_estado} /></span>
                                                                </div>
                                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                                    Operational Load <span className={cn(isLight ? 'text-slate-800' : 'text-white')}>
                                                                        {asesores.filter(x => x.login === a.login && (x.estado === 'DISPONIBLE' || x.estado === 'EN_GESTION')).length} Cases
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-end justify-between mt-6">
                                                            <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border backdrop-blur-sm",
                                                                st.color, st.color.replace('text-', 'bg-').concat('/20'), st.color.replace('text-', 'border-').concat('/40')
                                                            )}>
                                                                {st.label}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-6 h-full">
                                        <div className={cn(
                                            "glass-panel p-6 flex flex-col h-full rounded-2xl border transition-all duration-500",
                                            theme === 'light' ? "bg-white border-slate-200 shadow-xl" : "bg-[#0a111a] border-[#1e293b]"
                                        )}>
                                            <div className="flex items-center gap-2 mb-8">
                                                <h3 className={cn("text-[13px] font-black tracking-tight", theme === 'light' ? 'text-slate-700' : 'text-slate-200')}>CENTRO DE REPORTES</h3>
                                            </div>

                                            <div className="flex items-center gap-2 mb-6">
                                                <h4 className={cn("text-[10px] font-black uppercase tracking-[0.15em]", theme === 'light' ? 'text-blue-600' : 'text-blue-500')}>ACTIVIDAD RECIENTE</h4>
                                            </div>

                                            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                                                {gestiones.slice(0, 8).map((g, i) => (
                                                    <div key={i} className={cn(
                                                        "p-4 rounded-xl border transition-all",
                                                        theme === 'light'
                                                            ? "bg-[#f8fafc] border-slate-100"
                                                            : "bg-[#111827]/50 border-white/5"
                                                    )}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest",
                                                                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                                                            )}>
                                                                {g.gestion === 'SOPORTE' ? 'ASESORÍA' : (g.gestion === 'RECLAMO' ? 'RECLAMO' : g.gestion)}
                                                            </span>
                                                            <span className="text-[9px] font-mono text-slate-500 tracking-widest">{new Date(g.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <p className={cn("text-[13px] font-black leading-tight", theme === 'light' ? 'text-slate-800' : 'text-white')}>{g.nombre}</p>
                                                        <p className={cn(
                                                            "text-[10px] font-bold mt-1.5 flex items-center gap-1.5",
                                                            theme === 'light' ? 'text-slate-500' : (g.gestion === 'CIERRE' ? 'text-emerald-500' : 'text-orange-500')
                                                        )}>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-3 pt-6 mt-4">
                                                <button onClick={exportToExcel} className={cn(
                                                    "w-full py-4 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                                                    "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                                                )}>
                                                    <span>EXPORTAR BASE EXCEL (XLSX)</span>
                                                    <Download size={14} className="opacity-70 group-hover:translate-y-0.5 transition-transform" />
                                                </button>
                                                <button onClick={exportToPDF} className={cn(
                                                    "w-full py-4 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-between group",
                                                    theme === 'light'
                                                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                        : "bg-[#1e293b] text-slate-300 hover:bg-[#2d3a4f]"
                                                )}>
                                                    <span>GENERAR REPORTE PDF</span>
                                                    <FileText size={14} className="opacity-70 group-hover:scale-110 transition-transform" />
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
                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all", theme === 'light' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-slate-500/10 text-slate-400 group-hover:bg-blue-600/10 group-hover:text-blue-500')}>
                                                    {a.login.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className={cn("font-black text-sm uppercase mb-1", theme === 'light' ? 'text-slate-800' : 'text-white')}>{a.nombre_asesor}</h3>
                                                    <p className={cn("text-[10px] font-bold uppercase", theme === 'light' ? 'text-slate-500' : 'text-slate-500')}>{a.perfil}</p>
                                                </div>
                                            </div>

                                            <div className={cn("space-y-4 p-5 rounded-3xl border border-white/5", theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/40')}>
                                                <div className="flex justify-between items-center">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", theme === 'light' ? 'text-slate-600' : 'text-slate-500')}>Estado Actual</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-2 h-2 rounded-full", ESTADOS_CONFIG[a.estado]?.dot)} />
                                                        <span className={cn("text-[10px] font-black uppercase", ESTADOS_CONFIG[a.estado]?.color)}>
                                                            {ESTADOS_CONFIG[a.estado]?.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", theme === 'light' ? 'text-slate-600' : 'text-slate-500')}>Tiempo Acumulado</span>
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
                                            {loading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <tr key={i} className="border-t border-white/5">
                                                        <td colSpan={6} className="px-8 py-4">
                                                            <Skeleton className="h-6 w-full" />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                asesores.filter(a => !busqueda || a.nombre_asesor.toUpperCase().includes(busqueda.toUpperCase()) || a.cedula.includes(busqueda)).map((a) => (
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
                                                ))
                                            )}
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
                                        <thead className="bg-[#060d14] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5 shadow-xl">
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
                                                        <h4 className={cn("text-lg font-black uppercase leading-tight mt-1 truncate max-w-[200px]", theme === 'light' ? 'text-slate-800' : 'text-white')}>{n.contenido}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", n.activa ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-white/10")}>
                                                        {n.activa ? "VISIBLE" : "OCULTA"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className={cn("text-sm font-medium leading-relaxed mb-8 h-20 overflow-hidden line-clamp-3 italic uppercase font-black", theme === 'light' ? 'text-slate-700' : 'text-slate-400')}>
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
                                        <thead className="sticky top-0 bg-[#060d14] z-20 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-xl">
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
                                            <input name="nombre_asesor" defaultValue={modalConfig.data?.nombre_asesor} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="EJ: JUAN PEREZ" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Cédula</label>
                                            <input name="cedula" defaultValue={modalConfig.data?.cedula} className={cn("w-full border p-5 rounded-2xl text-xs font-black outline-none focus:border-blue-500/50", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="1010..." />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Login / Usuario</label>
                                            <input name="login" defaultValue={modalConfig.data?.login} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-500/50", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} required placeholder="USER_N1" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Perfil de Asistencia</label>
                                            <select name="perfil" defaultValue={modalConfig.data?.perfil || 'TODO'} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                                                {Object.entries(PERFILES_CONFIG).map(([v, c]: any) => <option key={v} value={v}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Estado Actual</label>
                                            <select name="estado" defaultValue={modalConfig.data?.estado || 'NO_DISPONIBLE'} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
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
                                                    className="w-5 h-5 rounded border-white/10 bg-[#060d14] text-amber-500"
                                                />
                                                <label htmlFor="activa_news" className="text-[10px] font-black uppercase text-white cursor-pointer select-none">Mostrar inmediatamente al soporte y despacho</label>
                                            </div>
                                        </div>
                                    </>
                                ) : modalConfig.type === 'soporte' ? (
                                    <div className="col-span-2 space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className={cn("p-6 rounded-[2rem] border shadow-xl", theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5')}>
                                                <div className="flex items-center gap-3 mb-4 text-emerald-500">
                                                    <Clock size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Timestamp</span>
                                                </div>
                                                <p className={cn("text-sm font-mono font-black", theme === 'light' ? 'text-black' : 'text-white')}>{new Date(modalConfig.data?.fecha_hora).toLocaleString('es-CO')}</p>
                                            </div>
                                            <div className={cn("p-6 rounded-[2rem] border shadow-xl", theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5')}>
                                                <div className="flex items-center gap-3 mb-4 text-amber-500">
                                                    <ShieldCheck size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Radicado Incident</span>
                                                </div>
                                                <p className={cn("text-sm font-mono font-black italic", theme === 'light' ? 'text-black' : 'text-white')}>#{modalConfig.data?.incidente || '---'}</p>
                                            </div>
                                        </div>

                                        <div className={cn("p-8 rounded-[2.5rem] border shadow-inner space-y-6", theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/40 border-white/5')}>
                                            <div className={cn("flex items-center gap-4 border-b pb-4", theme === 'light' ? 'border-slate-300' : 'border-white/5')}>
                                                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500"><User size={20} /></div>
                                                <div>
                                                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Información del Funcionario</h4>
                                                    <p className={cn("text-lg font-black uppercase tracking-tighter italic leading-none", theme === 'light' ? 'text-black' : 'text-white')}>{modalConfig.data?.nombre}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-8 px-2">
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Celular Reportado</span>
                                                    <span className="text-xs font-black text-blue-400">{modalConfig.data?.celular || '---'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-1">Ubicación / Torre</span>
                                                    <span className={cn("text-xs font-black uppercase", theme === 'light' ? 'text-black' : 'text-white')}>{modalConfig.data?.torre || '---'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Procedimiento / Gestión Realizada</span>
                                                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[8px] font-black uppercase border border-blue-500/20">{modalConfig.data?.gestion}</span>
                                            </div>
                                            <div className={cn("p-8 rounded-[2.5rem] border italic text-sm font-serif leading-relaxed shadow-lg", theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-500/5 border-white/5 text-slate-300')}>
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
                                            <input name="incidente" defaultValue={modalConfig.data?.incidente} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} placeholder="INC000..." />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Gestión</label>
                                            <select name="gestion" defaultValue={modalConfig.data?.gestion} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                                                <option value="SOPORTE">SOPORTE</option>
                                                <option value="CIERRE">CIERRE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Estado</label>
                                            <select name="estado" defaultValue={modalConfig.data?.estado} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                                                <option value="En gestión">En gestión</option>
                                                <option value="Resuelto">Resuelto</option>
                                                <option value="Enrutado">Enrutado</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Login Asignado (N1)</label>
                                            <select name="login_n1" defaultValue={modalConfig.data?.login_n1} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-800 border-white/10 text-white')}>
                                                {asesores.map(a => <option key={a.id} value={a.login}>{a.login}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Torre</label>
                                            <input name="torre" defaultValue={modalConfig.data?.torre} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} />
                                        </div>
                                        <div className="space-y-4 col-span-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Observaciones</label>
                                            <textarea name="observaciones" defaultValue={modalConfig.data?.observaciones} className={cn("w-full border p-5 rounded-2xl text-xs font-black uppercase outline-none h-24", theme === 'light' ? 'bg-slate-100 border-slate-200 text-black' : 'bg-slate-500/5 border-white/10 text-white')} />
                                        </div>
                                    </>
                                )}
                            </div>

                            {activeTab === "audit_logs" && (
                                <div className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative group">
                                    <div className="p-10 border-b border-white/5 bg-white/[0.02]">
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-4">
                                            <ClipboardList className="text-blue-500" /> Registro de Actividad Administrativa
                                        </h3>
                                    </div>
                                    <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-[#0f172a]/80 backdrop-blur sticky top-0 z-20">
                                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                                    <th className="px-10 py-6">USUARIO</th>
                                                    <th className="px-10 py-6">ACCIÓN REALIZADA</th>
                                                    <th className="px-10 py-6 text-right font-black">FECHA Y HORA</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-[11px] font-bold">
                                                {auditLogs.filter(log =>
                                                    log.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
                                                    log.accion.toLowerCase().includes(busqueda.toLowerCase())
                                                ).map((log) => (
                                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                                        <td className="px-10 py-6">
                                                            <span className="bg-blue-600/10 text-blue-500 px-3 py-1.5 rounded-xl uppercase tracking-widest text-[9px] font-black border border-blue-500/20 shadow-inner group-hover/row:scale-105 transition-transform inline-block">
                                                                {log.usuario}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-6 text-slate-300 font-mono tracking-tight italic uppercase text-[10px] leading-relaxed">
                                                            {log.accion}
                                                        </td>
                                                        <td className="px-10 py-6 text-right text-slate-500 font-mono tabular-nums">
                                                            {formatFechaString(log.fecha_hora)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {auditLogs.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-10 py-20 text-center text-slate-600 italic uppercase text-[10px] font-black tracking-widest bg-white/[0.01]">
                                                            No hay registros de auditoría disponibles
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

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
                    background: ${theme === 'dark' ? '#040a1352' : '#eff1f2'};
                    border-radius: 12px;
                    border: 1px solid ${theme === 'light' ? 'transparent' : 'rgba(255,255,255,0.05)'};
                    box-shadow: ${theme === 'light' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0,0,0,0.4)'};
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(193, 209, 235, 0.5); }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
