"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Users, BarChart3, Download, Clock, ShieldCheck,
    Settings, Search, Sun, Moon, Briefcase,
    Activity, ArrowUpRight, Filter, Database,
    FileSpreadsheet, ClipboardCheck, AlertTriangle,
    Plus, Edit2, Trash2, X, Check, ChevronRight, UserPlus, HardDrive, UserCheck,
    FileText, FileJson
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const PERFILES_CONFIG: any = {
    "EN_CIERRES": { label: "En Cierres", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    "SOLO_SOPORTES": { label: "Solo Soportes", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    "TODO": { label: "Todo tipo de gestión", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" }
};

const ESTADOS_CONFIG: any = {
    "EN_GESTION": { label: "En gestión", color: "text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50" },
    "EN_DESCANSO": { label: "En descanso", color: "text-rose-500", dot: "bg-rose-500 shadow-rose-500/50" },
    "NO_DISPONIBLE": { label: "No disponible", color: "text-slate-500", dot: "bg-slate-500 shadow-slate-500/10" },
    "CASO_COMPLEJO": { label: "Caso complejo", color: "text-amber-500", dot: "bg-amber-500 shadow-amber-500/50" }
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, asesores, funcionarios, soportes
    const [asesores, setAsesores] = useState<any[]>([]);
    const [gestiones, setGestiones] = useState<any[]>([]);
    const [funcionarios, setFuncionarios] = useState<any[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal States
    const [modalConfig, setModalConfig] = useState<{
        type: 'asesor' | 'funcionario' | 'soporte',
        mode: 'add' | 'edit',
        data?: any
    } | null>(null);

    useEffect(() => {
        setHasMounted(true);
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [resAsesores, resGestiones, resFuncs] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/asesores/"),
                fetch("http://127.0.0.1:8000/api/soporte/"),
                fetch("http://127.0.0.1:8000/api/funcionarios/")
            ]);
            const [dataA, dataG, dataF] = await Promise.all([
                resAsesores.json(), resGestiones.json(), resFuncs.json()
            ]);

            setAsesores(dataA);
            setGestiones(dataG.sort((a: any, b: any) => b.id - a.id));
            setFuncionarios(dataF);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
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
            }
        } catch (error) {
            console.error(`Error in ${action} ${type}:`, error);
        }
    };

    const exportToExcel = () => {
        if (gestiones.length === 0) return;

        const dataParaExcel = gestiones.map(g => ({
            "ID": g.id,
            "FECHA Y HORA": new Date(g.fecha_hora).toLocaleString('es-CO'),
            "ASESOR": g.nombre,
            "LOGIN": g.login_n1,
            "GESTION": g.gestion,
            "INCIDENTE": g.incidente || 'N/A',
            "ESTADO": g.estado,
            "OBSERVACIONES": g.observaciones || ''
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

        const tableColumn = ["ID", "Fecha/Hora", "Asesor", "Gestión", "Incidente", "Estado", "Observaciones"];
        const tableRows = gestiones.map(g => [
            g.id,
            new Date(g.fecha_hora).toLocaleString('es-CO'),
            g.nombre,
            g.gestion,
            g.incidente || 'N/A',
            g.estado,
            (g.observaciones || '').substring(0, 50) + (g.observaciones?.length > 50 ? '...' : '')
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                6: { cellWidth: 80 } // Ancho para observaciones
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
        soportes: gestiones.filter(g => g.gestion === "SOPORTE").length,
        en_gestion: asesores.filter(a => a.estado === "EN_GESTION").length,
        en_descanso: asesores.filter(a => a.estado === "EN_DESCANSO").length
    };

    if (!hasMounted) return null;

    return (
        <div className={cn(
            "min-h-screen relative transition-colors duration-500",
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
                            { id: "funcionarios", label: "Base de Funcionarios", icon: UserCheck },
                            { id: "soportes", label: "Histórico de Incidentes", icon: Database }
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
                        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center justify-center gap-3 p-4 bg-slate-500/5 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-500/10 transition-all">
                            {theme === "dark" ? <><Sun size={14} /> Modo Claro</> : <><Moon size={14} /> Modo Oscuro</>}
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
                    <header className="h-24 px-10 border-b border-white/5 flex items-center justify-between glass-panel">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                                {activeTab === 'dashboard' ? 'Panel de Control' : activeTab === 'asesores' ? 'Administrar Técnicos' : activeTab === 'funcionarios' ? 'Directorio Funcionarios' : 'Registro de Actividad'}
                            </h2>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black tracking-widest animate-pulse border border-blue-500/20 uppercase">Live Update</span>
                        </div>

                        <div className="flex items-center gap-6">
                            {(activeTab === 'asesores' || activeTab === 'funcionarios') && (
                                <button
                                    onClick={() => setModalConfig({ type: activeTab === 'asesores' ? 'asesor' : 'funcionario', mode: 'add' })}
                                    className="px-6 py-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={16} /> Agregar {activeTab === 'asesores' ? 'Asesor' : 'Funcionario'}
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
                                        { label: "GESTIONES TOTALES", value: totalStats.total, icon: Database, color: "blue" },
                                        { label: "CIERRES EXITOSOS", value: totalStats.cierres, icon: ClipboardCheck, color: "emerald" },
                                        { label: "SOPORTES WEB", value: totalStats.soportes, icon: Briefcase, color: "amber" },
                                        { label: "ASESORES EN GESTIÓN", value: totalStats.en_gestion, icon: Activity, color: "emerald" },
                                        { label: "EN DESCANSO", value: totalStats.en_descanso, icon: Clock, color: "rose" }
                                    ].map((stat, i) => (
                                        <div key={i} className="glass-panel p-6 rounded-[2rem] border border-white/5 group hover:border-blue-500/30 transition-all">
                                            <div className={cn("p-4 rounded-2xl w-fit mb-4 text-" + stat.color + "-500 bg-slate-500/5")}>
                                                <stat.icon size={22} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mb-1">{stat.label}</p>
                                            <p className="text-3xl font-black italic tracking-tighter">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Activity className="text-blue-500" size={18} /><h3 className="text-[12px] font-black uppercase italic tracking-wider">Estado en Vivo del Personal</h3></div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {asesores.slice(0, 6).map((a) => {
                                                const stats = getStatsPerAsesor(a.login);
                                                const st = ESTADOS_CONFIG[a.estado] || ESTADOS_CONFIG.NO_DISPONIBLE;
                                                return (
                                                    <div key={a.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-500/10 flex items-center justify-center font-black text-blue-500">{a.login.substring(0, 2).toUpperCase()}</div>
                                                                <div>
                                                                    <h4 className="text-[13px] font-black uppercase">{a.nombre_asesor}</h4>
                                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{a.login} • {a.perfil}</p>
                                                                </div>
                                                            </div>
                                                            <div className={cn("px-3 py-1 rounded-lg flex items-center gap-2", st.color.replace('text', 'bg').replace('500', '500/10'))}>
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                                                                <span className={cn("text-[8px] font-black uppercase", st.color)}>{st.label}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-black mb-2 uppercase"><span>Rendimiento Hoy</span><span>{stats.total} Total</span></div>
                                                        <div className="h-2 w-full bg-slate-500/10 rounded-full overflow-hidden flex">
                                                            <div style={{ width: `${(stats.cierres / (stats.total || 1)) * 100}%` }} className="bg-emerald-500 h-full" />
                                                            <div style={{ width: `${(stats.soportes / (stats.total || 1)) * 100}%` }} className="bg-blue-500 h-full" />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4"><Download className="text-emerald-500" size={18} /><h3 className="text-[12px] font-black uppercase italic tracking-wider">Centro de Reportes</h3></div>
                                        <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Actividad Reciente</h4>
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {gestiones.slice(0, 5).map((g, i) => (
                                                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mb-1"><span>{g.gestion}</span><span>{new Date(g.fecha_hora).toLocaleTimeString()}</span></div>
                                                            <p className="text-[11px] font-black uppercase truncate">{g.nombre}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={exportToExcel} className="w-full mt-6 py-4 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-600/20 transition-all flex items-center justify-center gap-3">
                                                <FileSpreadsheet size={14} /> Exportar base Excel (XLSX)
                                            </button>
                                            <button onClick={exportToPDF} className="w-full mt-2 py-4 bg-rose-600/10 border border-rose-600/20 rounded-2xl text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-600/20 transition-all flex items-center justify-center gap-3">
                                                <FileText size={14} /> Generar Reporte PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- TAB: ASESORES (MANAGEMENT) --- */}
                        {activeTab === "asesores" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-500/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <tr>
                                                <th className="px-8 py-6">ID</th>
                                                <th className="px-8 py-6">NOMBRES Y APELLIDOS</th>
                                                <th className="px-8 py-6">LOGIN / DOCUMENTO</th>
                                                <th className="px-8 py-6">PERFIL ASIGNADO</th>
                                                <th className="px-8 py-6">ESTADO ACTUAL</th>
                                                <th className="px-8 py-6 text-center">ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold">
                                            {asesores.filter(a => !busqueda || a.nombre_asesor.toUpperCase().includes(busqueda.toUpperCase()) || a.cedula.includes(busqueda)).map((a) => (
                                                <tr key={a.id} className="border-t border-white/5 hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-5 text-slate-500 font-mono">#{a.id}</td>
                                                    <td className="px-8 py-5 uppercase font-black">{a.nombre_asesor}</td>
                                                    <td className="px-8 py-5 uppercase tracking-tighter">
                                                        <div className="flex flex-col"><span>{a.login}</span><span className="text-[8px] opacity-50">{a.cedula}</span></div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase", PERFILES_CONFIG[a.perfil]?.bg, PERFILES_CONFIG[a.perfil]?.color)}>
                                                            {PERFILES_CONFIG[a.perfil]?.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", ESTADOS_CONFIG[a.estado]?.dot)} />
                                                            <span className="uppercase text-[9px] font-black">{ESTADOS_CONFIG[a.estado]?.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-center gap-4">
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

                        {/* --- TAB: SOPORTES (LOGBOOK) --- */}
                        {activeTab === "soportes" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden max-h-[800px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[1200px]">
                                        <thead className="sticky top-0 bg-slate-900 z-20 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-xl">
                                            <tr>
                                                <th className="px-8 py-6">FECHA/HORA</th>
                                                <th className="px-6 py-6">GESTION</th>
                                                <th className="px-8 py-6">SOLICITANTE</th>
                                                <th className="px-8 py-6">INCIDENTE</th>
                                                <th className="px-8 py-6">ASESOR</th>
                                                <th className="px-8 py-6">ACCIONES</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[11px] font-bold">
                                            {gestiones.filter(g => !busqueda || g.incidente?.includes(busqueda) || g.nombre?.toUpperCase().includes(busqueda.toUpperCase())).map((g) => (
                                                <tr key={g.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                                    <td className="px-8 py-5 text-slate-500">{new Date(g.fecha_hora).toLocaleString()}</td>
                                                    <td className="px-6 py-5">
                                                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded text-[9px] font-black uppercase">{g.gestion}</span>
                                                    </td>
                                                    <td className="px-8 py-5 uppercase truncate max-w-[200px]">{g.nombre}</td>
                                                    <td className="px-8 py-5 text-amber-500 font-black">{g.incidente || '---'}</td>
                                                    <td className="px-8 py-5 uppercase font-black text-slate-300">{g.login_n1}</td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => setModalConfig({ type: 'soporte', mode: 'edit', data: g })} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Editar Incidente"><Edit2 size={16} /></button>
                                                            <button onClick={() => { if (confirm('¿ELIMINAR REGISTRO DE SOPORTE? Esta acción no se puede deshacer.')) handleAction('soporte', 'DELETE', g.id) }} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Eliminar Incidente"><Trash2 size={16} /></button>
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
                            handleAction(
                                modalConfig.type === 'asesor' ? 'asesores' : 'funcionarios',
                                modalConfig.mode === 'add' ? 'POST' : 'PATCH',
                                modalConfig.data?.id,
                                data
                            );
                        }}>
                            <div className="grid grid-cols-2 gap-8">
                                {modalConfig.type === 'asesor' ? (
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
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <label className="text-[9px] font-black text-slate-500 uppercase px-1 tracking-widest">Nombre Funcionario</label>
                                            <input name="nombre" defaultValue={modalConfig.data?.nombre} className="w-full bg-slate-500/5 border border-white/10 p-5 rounded-2xl text-xs font-black uppercase outline-none" required />
                                        </div>
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

                            <button type="submit" className="w-full py-6 bg-blue-600 shadow-xl shadow-blue-500/30 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                                <Check size={18} /> {modalConfig.mode === 'add' ? 'Confirmar Registro' : 'Guardar Cambios'}
                            </button>
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
