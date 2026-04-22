"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Components
import SidebarAdmin from "../components/SidebarAdmin";
import CabeceraAdmin from "../components/CabeceraAdmin";
import TarjetasKPIAdmin from "../components/TarjetasKPIAdmin";
import ListaAsesoresAdmin from "../components/ListaAsesoresAdmin";
import ActividadRecienteAdmin from "../components/ActividadRecienteAdmin";
import PestanaAsesoresAdmin from "../components/PestanaAsesoresAdmin";
import PestanaFuncionariosAdmin from "../components/PestanaFuncionariosAdmin";
import PestanaNoticiasAdmin from "../components/PestanaNoticiasAdmin";
import PestanaSoportesAdmin from "../components/PestanaSoportesAdmin";
import PestanaHistoricoAsesoresAdmin from "../components/PestanaHistoricoAsesoresAdmin";
import PestanaAuditoriaAdmin from "../components/PestanaAuditoriaAdmin";
import ModalesAdmin from "../components/ModalesAdmin";

// Types & Constants
import { Soporte, AsesorSoporte, Funcionario, Noticia, AuditLog } from "../../types";
import { ESTADOS_CONFIG } from "../../constants";
import { formatearFecha } from "../../utils/formatters";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente Principal `AdminDashboard` (Administrador)
 * 
 * Interfaz maestra o "Consola" que permite visualizar y gestionar todos los registros
 * del sistema SIMOC. Controla el CRUD de técnicos (funcionarios), asesores de nivel 1,
 * novedades y logs de auditoría general. 
 * Además, exporta reportes en CSV/Excel y PDF, y monitoriza conexiones en vivo vía WebSockets.
 * 
 * @returns {JSX.Element} Aplicación Dashboard embebida
 */
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [asesores, setAsesores] = useState<AsesorSoporte[]>([]);
    const [gestiones, setGestiones] = useState<Soporte[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [noticias, setNoticias] = useState<Noticia[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [hasMounted, setHasMounted] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

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
        } else {
            setIsLoggedIn(true);
        }
    }, [router]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
            // Optional: WebSocket for real-time updates
            const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/updates/`);
            socket.onmessage = () => fetchData();
            return () => socket.close();
        }
    }, [isLoggedIn]);

    /**
     * Trae y asigna de manera paralela todos los conjuntos de datos masivos.
     * Realiza un `Promise.all` para resolver Asesores, Gestiones, Funcionarios, Noticias y AuditLogs.
     */
    const fetchData = async () => {
        const token = Cookies.get("accessToken");
        if (!token) return;

        try {
            const headers = { "Authorization": `Bearer ${token}` };
            const [resAsesores, resGestiones, resFuncs, resNoticias, resAudit] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/funcionarios/`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/noticias/`, { headers }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs/`, { headers })
            ]);

            if (resAsesores.status === 401) {
                router.push("/login");
                return;
            }

            const [dataA, dataG, dataF, dataN, dataAudit] = await Promise.all([
                resAsesores.json(), resGestiones.json(), resFuncs.json(), resNoticias.json(), resAudit.json()
            ]);

            setAsesores(dataA);
            setGestiones(dataG.sort((a: Soporte, b: Soporte) => b.id - a.id));
            setFuncionarios(dataF);
            setNoticias(dataN.sort((a: Noticia, b: Noticia) => b.id - a.id));
            setAuditLogs(dataAudit);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    };

    /**
     * Termina la sesion del Admin removiendo cookies 
     * e interceptando via Router al `/login`.
     */
    const handleLogout = () => {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("adminUser");
        router.push("/login");
    };

    /**
     * Hook Asíncrono orquestador de las mutaciones DB.
     * Enruta peticiones CREADAS, ACTUALIZADAS (PATCH) o ELIMINADAS basadas
     * en el `type` u origen (Asesores, Funcionarios, etc.).
     * @param {string} type - Colección/endpoint en la REST API (e.x "asesores")
     * @param {string} action - Verbo HTTP ('POST', 'PATCH', 'DELETE')
     * @param {number} [id] - Parámetro de segmento PK de registro
     * @param {any} [data] - Objeto a procesar como Payload/Body
     */
    const handleAction = async (type: string, action: string, id?: number, data?: any) => {
        const token = Cookies.get("accessToken");
        const user = Cookies.get("adminUser") || 'ADMIN';
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/${type}/${id ? id + '/' : ''}${action === 'DELETE' ? `?admin_user=${user}` : ''}`;

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
                toast.error(`ERROR AL PROCESAR: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            toast.error("ERROR DE CONEXIÓN CON EL SERVIDOR");
        }
    };

    /**
     * Dispara un borrado forzado de los históricos de logs temporales
     * guardados para un usuario Asesor puntual.
     * @param {number} asesorId - PK del asesor.
     */
    const handleClearHistory = async (asesorId: number) => {
        if (!confirm("¿ESTÁ SEGURO DE VACIAR TODO EL HISTORIAL DE ESTE ASESOR?")) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/${asesorId}/clear_history/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_user: Cookies.get("adminUser") || 'AVASQUEZ' })
            });

            if (res.ok) {
                toast.success("HISTORIAL VACIADO EXITOSAMENTE");
                setModalConfig(null);
                fetchData();
            } else {
                toast.error("ERROR AL VACIAR EL HISTORIAL");
            }
        } catch (error) {
            toast.error("ERROR DE CONEXIÓN CON EL SERVIDOR");
        }
    };

    /**
     * Evalúa métricas pasivas sobre un `login` determinado
     * (Cuantas resoluciones tiene vs Casos asignados a su número).
     * @param {string} login - Usuario (Ej. `MRODRIGUEZ`)
     * @returns {Object} {total, cierres, soportes} counts
     */
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

    /**
     * Función delegada para invocar SheetJS (XLSX).
     * Genera un volcado de las Gestiones renderizándolas en crudo hacia un EXCEL.
     */
    const exportToExcel = () => {
        if (gestiones.length === 0) return;
        const dataParaExcel = gestiones.map(g => ({
            "FECHA Y HORA": formatearFecha(g.fecha_hora),
            "FUNCIONARIO": g.nombre,
            "CELULAR": g.celular || '---',
            "TORRE": g.torre || '---',
            "INCIDENTE": g.incidente || '---',
            "GESTION": g.gestion,
            "OBSERVACIONES": g.observaciones || '',
            "ASESOR_N1": g.login_n1 || 'SIN ASIGNAR',
            "ESTADO": g.estado
        }));
        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Gestiones");
        XLSX.writeFile(wb, `reporte_soporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    /**
     * Función delegada para invocar `jsPDF`.
     * Levanta una grilla (autoTable) con cabeceras estrictas sobre métricas directas y compila.
     */
    const exportToPDF = () => {
        if (gestiones.length === 0) return;
        const doc = new jsPDF('landscape');
        doc.setFontSize(20);
        doc.text("REPORTE HISTÓRICO DE GESTIONES - PHOENIX MOC", 14, 22);
        const tableColumn = ["Fecha/Hora", "Funcionario", "Torre", "Incidente", "Gestión", "Obs.", "Asesor N1", "Estado"];
        const tableRows = gestiones.map(g => [
            new Date(g.fecha_hora).toLocaleString('es-CO'),
            g.nombre,
            g.torre || '---',
            g.incidente || '---',
            g.gestion,
            (g.observaciones || '').substring(0, 30),
            g.login_n1 || 'SIN ASIGNAR',
            g.estado
        ]);
        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 7 }
        });
        doc.save(`reporte_soporte_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (!hasMounted) return null;

    return (
        <div className={cn(
            "min-h-screen relative transition-colors duration-500 overflow-hidden",
            theme === "light" ? "bg-[#F3F4F6] text-slate-800" : "bg-[#020810] text-slate-200"
        )}>
            <div className="relative z-10 flex h-screen overflow-hidden">
                <SidebarAdmin
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    theme={theme}
                    setTheme={setTheme}
                    handleLogout={handleLogout}
                />

                <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
                    <CabeceraAdmin
                        activeTab={activeTab}
                        busqueda={busqueda}
                        setBusqueda={setBusqueda}
                        setModalConfig={setModalConfig}
                        exportToPDF={exportToPDF}
                        exportToExcel={exportToExcel}
                        hasMounted={hasMounted}
                    />

                    <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                        {activeTab === "dashboard" && (
                            <>
                                <div className="mb-10 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-0.5 w-10 bg-emerald-500/50 rounded-full" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">SISTEMA INTEGRAL SIMOC</span>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                                        BIENVENIDO DE NUEVO, <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">ADMINISTRADOR</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Consola Maestra de Operaciones • {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                                <TarjetasKPIAdmin loading={loading} totalStats={totalStats} theme={theme} />
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 space-y-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <div className="flex flex-col">
                                                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">LIVE MONITORING UNIT</h3>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">PERSONAL EN OPERACIÓN</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                {Object.entries(ESTADOS_CONFIG).slice(0, 3).map(([key, cfg]) => (
                                                    <div key={key} className={cn("flex items-center gap-2.5 px-3 py-1 rounded-full border border-white/10 shadow-inner", theme === 'light' ? 'bg-white' : 'bg-[#09101A]')}>
                                                        <div className={cn("w-2 h-2 rounded-full", cfg.dot.split(' ')[0])} />
                                                        <span className={cn("text-[9px] font-black", theme === 'light' ? 'text-slate-800' : 'text-slate-500')}>
                                                            {asesores.filter(a => a.estado === key).length}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <ListaAsesoresAdmin asesores={asesores} theme={theme} getStatsPerAsesor={getStatsPerAsesor} />
                                    </div>
                                    <div className="space-y-6 h-full">
                                        <div className={cn("glass-panel p-6 flex flex-col h-full rounded-2xl border", theme === 'light' ? "bg-white border-slate-200 shadow-xl" : "bg-[#0a111a] border-[#1e293b]")}>
                                            <h3 className="text-[13px] font-black tracking-tight mb-8">CENTRO DE REPORTES</h3>
                                            <ActividadRecienteAdmin gestiones={gestiones} theme={theme} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "asesores" && (
                            <PestanaAsesoresAdmin
                                loading={loading}
                                asesores={asesores}
                                busqueda={busqueda}
                                theme={theme}
                                setModalConfig={setModalConfig}
                                handleAction={handleAction}
                            />
                        )}

                        {activeTab === "funcionarios" && (
                            <PestanaFuncionariosAdmin
                                funcionarios={funcionarios}
                                busqueda={busqueda}
                                setModalConfig={setModalConfig}
                                handleAction={handleAction}
                            />
                        )}

                        {activeTab === "noticias" && (
                            <PestanaNoticiasAdmin
                                noticias={noticias}
                                theme={theme}
                                setModalConfig={setModalConfig}
                                handleAction={handleAction}
                            />
                        )}

                        {activeTab === "soportes" && (
                            <PestanaSoportesAdmin
                                gestiones={gestiones}
                                busqueda={busqueda}
                            />
                        )}

                        {activeTab === "historico_asesores" && (
                            <PestanaHistoricoAsesoresAdmin
                                asesores={asesores}
                                busqueda={busqueda}
                                theme={theme}
                            />
                        )}

                        {activeTab === "audit_logs" && (
                            <PestanaAuditoriaAdmin
                                auditLogs={auditLogs}
                                busqueda={busqueda}
                                theme={theme}
                            />
                        )}
                    </div>
                </main>
            </div>

            <ModalesAdmin
                modalConfig={modalConfig}
                setModalConfig={setModalConfig}
                theme={theme}
                asesores={asesores}
                handleAction={handleAction}
                handleClearHistory={handleClearHistory}
            />

            <style jsx global>{`
                .glass-panel {
                    background: ${theme === 'dark' ? 'rgb(4 7 11 / 80%)' : '#eff1f2'};
                    border-radius: 12px;
                    border: 1px solid ${theme === 'light' ? 'transparent' : 'rgba(0, 0, 0, 0.05)'};
                    box-shadow: ${theme === 'light' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : '0 4px 6px -1px rgba(0,0,0,0.4)'};
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
