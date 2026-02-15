"use client";

/**
 * DespachoPage Component
 * 
 * Este componente es la terminal para el personal de despacho.
 * Permite visualizar la gestión en tiempo real, asignar prioridades 
 * y dejar observaciones de despacho para soporte.
 */

import React, { useEffect, useState } from "react";
import { Search, ClipboardList, MessageSquareText, Save, Sun, Moon, Zap, ShieldAlert, Clock, AlertTriangle, Radio, AlertCircle } from "lucide-react";

/**
 * Utilidad para el manejo de clases dinámicas
 */
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

const estadosGestion = ["En gestión", "Enrutado", "Resuelto", "Mal Escalado"];

const coloresEstadoGestion: Record<string, string> = {
    "En gestión": "bg-emerald-800 text-white",
    "Enrutado": "bg-amber-200 text-amber-900",
    "Resuelto": "bg-emerald-200 text-emerald-900",
    "Mal Escalado": "bg-rose-700 text-white"
};

const estadosAsesorConfig: Record<string, { bg: string, dot: string }> = {
    "EN_GESTION": { bg: "bg-emerald-300 text-emerald-950", dot: "bg-emerald-500 shadow-emerald-500/50" },
    "EN_DESCANSO": { bg: "bg-emerald-800 text-white", dot: "bg-rose-500 shadow-rose-500/50" },
    "NO_DISPONIBLE": { bg: "bg-amber-200 text-amber-900", dot: "bg-rose-500 shadow-rose-500/50" },
    "CASO_COMPLEJO": { bg: "bg-rose-700 text-white", dot: "bg-rose-500 shadow-rose-500/50" }
};

const DespachoPage = () => {
    // --- ESTADOS ---
    const [datos, setDatos] = useState<any[]>([]);
    const [asesoresSoporte, setAsesoresSoporte] = useState<any[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [theme, setTheme] = useState("dark");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [modalConfig, setModalConfig] = useState<{
        id: number;
        campo: 'plantilla' | 'observaciones_ultima';
        texto: string;
    } | null>(null);

    const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

    const cargarDatos = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/soporte/");
            const json = await res.json();
            const ordenados = json.sort((a: any, b: any) => b.id - a.id);
            setDatos(ordenados);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    const cargarAsesores = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/asesores/");
            const data = await res.json();

            setAsesoresSoporte((prev: any[]) => {
                return data.map((asesorAPI: any) => {
                    // Sincronizar con lo que el asesor puso en su terminal (vía LocalStorage)
                    const estadoGuardado = typeof window !== 'undefined' ? localStorage.getItem(`asesor_estado_${asesorAPI.id}`) : null;
                    const asesorLocal = prev.find((p: any) => p.id === asesorAPI.id);

                    return {
                        ...asesorAPI,
                        estado: asesorAPI.estado || (estadoGuardado || (asesorLocal?.estado || "NO_DISPONIBLE"))
                    };
                });
            });
        } catch (error) {
            console.error("Error cargando asesores:", error);
        }
    };

    useEffect(() => {
        setHasMounted(true);
        cargarDatos();
        cargarAsesores();

        // Escuchar cambios en otras pestañas automáticamente
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key?.startsWith('asesor_estado_')) {
                cargarAsesores();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        const intervalo = setInterval(() => {
            cargarDatos();
            cargarAsesores();
        }, 2000);

        return () => {
            clearInterval(intervalo);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const actualizarSoporte = async (id: number, campo: string, valor: any) => {
        try {
            await fetch(`http://127.0.0.1:8000/api/soporte/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [campo]: valor }),
            });
            cargarDatos();
        } catch (error) { console.error("Error API Soporte:", error); }
    };


    const guardarObservacionDespacho = async () => {
        if (!modalConfig) return;

        // Actualización optimista
        setDatos(prev => prev.map(item =>
            item.id === modalConfig.id ? { ...item, [modalConfig.campo]: modalConfig.texto } : item
        ));

        await actualizarSoporte(modalConfig.id, "observaciones_ultima", modalConfig.texto);
        setModalConfig(null);
    };

    /**
     * Helper para formatear la plantilla técnica de JSON a texto legible
     */
    const formatearPlantillaParaEditor = (jsonString: string) => {
        try {
            const obj = JSON.parse(jsonString);
            return Object.entries(obj)
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n");
        } catch (e) {
            return jsonString; // Si no es JSON, devolver tal cual
        }
    };

    const formatearFechaHora = (fechaStr: string) => {
        if (!fechaStr) return "--/--/-- --:--";
        const d = new Date(fechaStr);
        const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return `${fecha} | ${hora}`;
    };

    const handleCopyTemplate = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("📋 Plantilla copiada al portapapeles");
    };

    const datosFiltrados = datos.filter((item) => {
        if (!busqueda) return true;
        return (item.incidente?.toLowerCase() || "").includes(busqueda.toLowerCase());
    });

    const totalCasos = datos.length;
    const resueltos = datos.filter(d => d.estado === "Resuelto").length;
    const enrutados = datos.filter(d => d.estado === "Enrutado").length;
    const pendientes = datos.filter(d => !d.login_n1 || d.login_n1 === "POR_ASIGNAR").length;

    if (!hasMounted) return <div className="min-h-screen bg-[#020617]" />;

    return (
        <div className={cn(
            "min-h-screen relative overflow-x-hidden cyber-grid transition-colors duration-300",
            theme === "light" ? "light bg-slate-50 text-slate-900" : "bg-[#020617] text-slate-200"
        )}>
            <div className="flex flex-col lg:flex-row h-screen relative z-10">
                <aside className={cn(
                    "fixed inset-y-0 left-0 z-50 w-80 glass-panel border-r border-white/5 transition-transform duration-500 lg:translate-x-0 lg:static lg:block",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex flex-col h-full">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">D</div>
                                <div>
                                    <h1 className={cn("font-black text-xl tracking-tighter italic uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
                                        PHOENIX <span className="text-amber-500">DESP</span>
                                    </h1>
                                </div>
                            </div>
                            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[.3em] px-2">ESTADO DE ASESORES</h3>
                            <div className="space-y-4">
                                {asesoresSoporte.map((asesor) => {
                                    const casosAsignados = datos.filter(d => d.login_n1 === asesor.login).length;
                                    return (
                                        <div key={asesor.id} className="bg-[#0f172a]/40 border border-white/5 p-5 rounded-[1.5rem] group transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg transition-colors",
                                                        estadosAsesorConfig[asesor.estado]?.bg || 'bg-slate-700 text-white'
                                                    )}>
                                                        {asesor.login.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-sm font-black tracking-tight uppercase", theme === "light" ? "text-slate-700" : "text-white")}>
                                                            {asesor.login}
                                                        </span>
                                                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest leading-none">
                                                            {casosAsignados} CASOS
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                                    estadosAsesorConfig[asesor.estado]?.dot || 'bg-slate-600'
                                                )} />
                                            </div>
                                            <div className="mt-4 px-4 py-2 bg-slate-500/5 rounded-xl border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase">{asesor.estado?.replace('_', ' ') || 'SIN ESTADO'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 bg-slate-500/5">
                            <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest">v1.2 Terminal Despacho</p>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                    <header className="h-24 glass-panel border-b border-white/5 flex items-center justify-between px-10 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">D</div>
                            <h2 className={cn("text-2xl font-black tracking-tighter italic uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
                                TERMINAL DE <span className="text-amber-500">DESPACHO</span>
                            </h2>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase">Live Connection</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 flex-1 max-w-2xl mx-12">
                            <div className="relative w-full group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="BUSCAR CASO POR INCIDENTE..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className={cn(
                                        "w-full pl-14 pr-6 py-4 border rounded-2xl text-[10px] font-black tracking-widest outline-none transition-all uppercase",
                                        theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-amber-500"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={toggleTheme} className="p-3 glass-card rounded-2xl">
                                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                        </div>
                    </header>

                    <main className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: "CASOS TOTALES", value: totalCasos, icon: ClipboardList, color: "amber" },
                                { label: "NODOS RESUELTOS", value: resueltos, icon: Save, color: "emerald" },
                                { label: "ENRUTADOS", value: enrutados, icon: Radio, color: "blue" },
                                { label: "PENDIENTES", value: pendientes, icon: AlertCircle, color: "rose" },
                            ].map((stat, idx) => (
                                <div key={idx} className="glass-panel p-6 rounded-[2rem] group hover:border-amber-500/40 transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn("p-3 rounded-2xl bg-slate-500/10 border border-white/10", stat.color === 'emerald' ? "text-emerald-500" : stat.color === 'blue' ? "text-blue-500" : stat.color === 'rose' ? "text-rose-500" : "text-amber-500")}>
                                            <stat.icon size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-500 tracking-[.3em] uppercase">{stat.label}</p>
                                            <p className={cn("text-3xl font-black italic tracking-tighter", theme === "light" ? "text-slate-900" : "text-white")}>{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-500/5">
                                <h3 className={cn("text-[11px] font-black tracking-[.4em] px-4 flex items-center gap-3 uppercase", theme === "light" ? "text-slate-900" : "text-white")}>
                                    MONITOREO DE GESTIONES ACTIVAS
                                </h3>
                            </div>

                            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[2000px]">
                                    <thead>
                                        <tr className={cn("text-[10px] font-black uppercase tracking-widest sticky top-0 z-20", theme === "light" ? "bg-slate-100 text-slate-500" : "bg-slate-950/95 text-slate-500 backdrop-blur-md")}>
                                            <th className="px-8 py-6 border-b border-white/5">MARCA TEMPORAL</th>
                                            <th className="px-6 py-6 border-b border-white/5 text-center">EN SITIO</th>
                                            <th className="px-8 py-6 border-b border-white/5 min-w-[200px]">TÉCNICO</th>
                                            <th className="px-8 py-6 border-b border-white/5">NUMERO INC</th>
                                            <th className="px-8 py-6 border-b border-white/5">TORRE</th>
                                            <th className="px-8 py-6 border-b border-white/5">GESTIÓN</th>
                                            <th className="px-8 py-6 border-b border-white/5 min-w-[250px]">OBSERVACIONES TÉCNICAS</th>
                                            <th className="px-8 py-6 border-b border-white/5">LOGIN N1</th>
                                            <th className="px-8 py-6 border-b border-white/5">ESTADO</th>
                                            <th className="px-8 py-6 border-b border-white/5">PLANTILLA</th>
                                            <th className="px-8 py-6 border-b border-white/5">OBS. DESPACHO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {datosFiltrados.map((d) => (
                                            <tr key={d.id} className="transition-all group border-l-4 hover:bg-amber-500/[0.03] border-transparent">
                                                <td className="px-8 py-6">
                                                    <p className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{formatearFechaHora(d.fecha_hora)}</p>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className={cn("inline-block w-8 h-8 rounded-lg text-[9px] font-black border flex items-center justify-center", (d.en_sitio === "SI" || d.en_sitio === true) ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" : "text-slate-500 border-white/10")}>{(d.en_sitio === "SI" || d.en_sitio === true) ? "SÍ" : "NO"}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black uppercase tracking-tight">{d.nombre}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{d.celular}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg font-mono font-black text-[10px] border border-amber-500/20">{d.incidente}</span>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-bold text-slate-400">
                                                    {d.torre}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase border", d.gestion === 'ASESORIA' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')}>
                                                        {d.gestion}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-[11px] text-slate-500 italic line-clamp-2 max-w-[300px]">"{d.observaciones || "SIN DATOS..."}"</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-white/5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                        <span className="text-[10px] font-black text-blue-400">{d.login_n1 === "POR_ASIGNAR" ? "PENDIENTE" : d.login_n1}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={cn(
                                                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase border text-center",
                                                        coloresEstadoGestion[d.estado || "En gestión"] || "bg-slate-900 text-slate-400 border-white/5"
                                                    )}>
                                                        {d.estado || "PENDIENTE"}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={() => {
                                                            const textoFormateado = formatearPlantillaParaEditor(d.plantilla || "{}");
                                                            setModalConfig({ id: d.id, campo: 'plantilla', texto: textoFormateado });
                                                        }}
                                                        className={cn(
                                                            "p-3 rounded-xl transition-all border",
                                                            (d.gestion === "CIERRE" || d.gestion === "ENRUTAR") ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950" : "bg-slate-500/10 border-white/5 text-slate-500"
                                                        )}
                                                    >
                                                        <ClipboardList size={16} />
                                                    </button>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <button
                                                        onClick={() => setModalConfig({ id: d.id, campo: 'observaciones_ultima', texto: d.observaciones_ultima || "" })}
                                                        className={cn(
                                                            "p-3 rounded-xl transition-all border group relative",
                                                            (d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión")
                                                                ? d.observaciones_ultima.startsWith("✅ VISTO")
                                                                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                                                    : "bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce-subtle"
                                                                : "bg-slate-500/10 border-white/5 text-slate-500 hover:bg-amber-500/20 hover:text-amber-500"
                                                        )}
                                                        title={d.observaciones_ultima?.startsWith("✅ VISTO") ? "Novedad Vista por Soporte" : "Novedad para Soporte"}
                                                    >
                                                        <MessageSquareText size={16} className={cn((d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión") ? "animate-pulse" : "")} />
                                                        {(d.observaciones_ultima && d.observaciones_ultima !== "Registro inicial de gestión" && !d.observaciones_ultima.startsWith("✅ VISTO")) && (
                                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-white"></span>
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </main>
                </div>

                {modalConfig && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-8 animate-in fade-in">
                        <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden p-10 space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    {modalConfig.campo === 'plantilla' ? <ClipboardList className="text-emerald-500" size={24} /> : <AlertTriangle className="text-amber-500" size={24} />}
                                    <h2 className="text-2xl font-black text-white italic uppercase">
                                        {modalConfig.campo === 'plantilla' ? "Visualizar Plantilla" : "Observación de Despacho"}
                                    </h2>
                                </div>
                                <button onClick={() => setModalConfig(null)} className="p-3 bg-white/5 rounded-full"><X size={20} className="text-slate-400" /></button>
                            </div>

                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                {modalConfig.campo === 'plantilla' ? "Contenido técnico (Solo lectura):" : "Ingrese la novedad para soporte:"}
                            </p>

                            <textarea
                                className={cn(
                                    "w-full h-64 p-8 bg-slate-950/50 border border-white/10 rounded-[2rem] text-sm outline-none resize-none transition-all font-medium",
                                    modalConfig.campo === 'plantilla' ? "text-emerald-400 font-mono" : "text-slate-200 focus:border-amber-500/50"
                                )}
                                value={modalConfig.texto}
                                readOnly={modalConfig.campo === 'plantilla'}
                                onChange={(e) => setModalConfig({ ...modalConfig, texto: e.target.value })}
                                placeholder="Escriba aquí la novedad..."
                            />

                            <div className="flex gap-6">
                                <button onClick={() => setModalConfig(null)} className="flex-1 px-8 py-5 border border-white/10 text-[10px] font-black uppercase rounded-2xl text-slate-500">Descartar</button>
                                {modalConfig.campo === 'plantilla' ? (
                                    <button onClick={() => handleCopyTemplate(modalConfig.texto)} className="flex-[2] px-8 py-5 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase shadow-lg shadow-emerald-500/20 text-xs">Copiar Datos</button>
                                ) : (
                                    <button onClick={guardarObservacionDespacho} className="flex-[2] px-8 py-5 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase shadow-lg shadow-amber-500/20 text-xs">Guardar Novedad</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const X = ({ size, className }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default DespachoPage;
