"use client";

import React from "react";
import { MessageSquare, Trash2, Hash, FileText } from "lucide-react";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

interface HistorialTableProps {
    historial: any[];
    loading: boolean;
    hiddenIds: number[];
    searchIncidente: string;
    setSearchIncidente: (val: string) => void;
    searchFecha: string;
    setSearchFecha: (val: string) => void;
    abrirChat: (id: number, incidente: string) => void;
    ocultarCaso: (id: number) => void;
}

const HistorialTable = ({
    historial,
    loading,
    hiddenIds,
    searchIncidente,
    setSearchIncidente,
    searchFecha,
    setSearchFecha,
    abrirChat,
    ocultarCaso
}: HistorialTableProps) => {

    const filtrados = historial.filter(item => {
        const isHidden = hiddenIds.includes(item.id);
        const matchesInc = item.incidente?.toLowerCase().includes(searchIncidente.toLowerCase());
        const matchesDate = !searchFecha || (item.fecha_hora && item.fecha_hora.startsWith(searchFecha));
        return !isHidden && matchesInc && matchesDate;
    });

    return (
        <section className="bg-[#0b1621]/40 border border-[#152233] rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#00e5a0]/10 border border-[#00e5a0]/20 rounded-2xl flex items-center justify-center">
                        <FileText className="text-[#00e5a0]" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Historial de <span className="text-[#00e5a0]">Gestiones</span></h3>
                        <p className="text-[9px] font-black text-[#608096] uppercase tracking-[0.2em] mt-1 opacity-70 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#00e5a0] animate-pulse"></span>
                            Monitor de actividad en tiempo real
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-[#060d14]/50 p-2 rounded-2xl border border-[#152233]">
                    <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#608096]" />
                        <input 
                            type="text"
                            placeholder="BUSCAR INCIDENTE..."
                            value={searchIncidente}
                            onChange={(e) => setSearchIncidente(e.target.value)}
                            className="bg-[#0b1621] border border-[#152233] rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none focus:border-[#00e5a0]/50 transition-all w-48 placeholder:text-[#3a5c72]"
                        />
                    </div>
                    <div className="relative">
                        <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#608096]" />
                        <input 
                            type="date"
                            value={searchFecha}
                            onChange={(e) => setSearchFecha(e.target.value)}
                            className="bg-[#0b1621] border border-[#152233] rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold text-white outline-none focus:border-[#00e5a0]/50 transition-all w-40 placeholder:text-[#3a5c72] [color-scheme:dark]"
                        />
                    </div>
                    {(searchIncidente || searchFecha) && (
                        <button 
                            onClick={() => { setSearchIncidente(""); setSearchFecha(""); }}
                            className="text-[8px] font-black text-rose-500 uppercase px-2 hover:underline"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b border-[#152233] text-[9px] font-black text-[#608096] uppercase tracking-[0.2em] pb-6">
                            <th className="pb-4 pl-4">CHAT</th>
                            <th className="pb-4">INCIDENTE</th>
                            <th className="pb-4">ESTADO</th>
                            <th className="pb-4">GESTIÓN</th>
                            <th className="pb-4">ASESOR ASIGNADO</th>
                            <th className="pb-4 pr-4 text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#152233]/50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="py-5 pl-4"><div className="h-9 w-12 bg-[#152233] animate-pulse rounded-lg" /></td>
                                    <td className="py-5"><div className="h-4 w-24 bg-[#152233] animate-pulse rounded-lg" /></td>
                                    <td className="py-5"><div className="h-7 w-20 bg-[#152233] animate-pulse rounded-lg" /></td>
                                    <td className="py-5"><div className="h-4 w-16 bg-[#152233] animate-pulse rounded-lg" /></td>
                                    <td className="py-5"><div className="h-4 w-32 bg-[#152233] animate-pulse rounded-lg" /></td>
                                    <td className="py-5 pr-4 text-right"><div className="h-8 w-8 bg-[#152233] animate-pulse rounded-lg ml-auto" /></td>
                                </tr>
                            ))
                        ) : filtrados.length > 0 ? (
                            filtrados.map((d, i) => (
                                <tr key={d.id || i} className="group hover:bg-[#060d14]/50 transition-colors">
                                    <td className="py-5 pl-4">
                                        <button
                                            onClick={() => abrirChat(d.id, d.incidente)}
                                            className={cn(
                                                "p-2.5 border rounded-xl transition-all relative flex items-center justify-center",
                                                d.chat_visto_tecnico === false
                                                    ? "border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
                                                    : "border-[#00e5a0]/30 hover:border-[#00e5a0] text-[#00e5a0] bg-[#00e5a0]/5"
                                            )}
                                            title="Abrir Chat"
                                        >
                                            <MessageSquare size={16} />
                                            {d.chat_visto_tecnico === false && (
                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600 border border-white/20"></span>
                                                </span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-xs font-black text-[#00e5a0] uppercase">{d.incidente || "N/A"}</span>
                                    </td>
                                    <td className="py-5">
                                        <span className={cn(
                                            "px-3 py-1.5 border text-[9px] font-black uppercase rounded-lg",
                                            d.estado === "Resuelto" ? "border-[#00e5a0] text-[#00e5a0] bg-[#00e5a0]/10"
                                                : d.estado === "Enrutado" ? "border-[#e5b800] text-[#e5b800] bg-[#e5b800]/10"
                                                    : d.estado === "Mal Escalado" ? "border-rose-500 text-rose-500 bg-rose-500/10"
                                                        : "border-[#152233] text-white bg-[#060d14]"
                                        )}>
                                            {d.estado || "EN GESTIÓN"}
                                        </span>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-[10px] font-black text-white uppercase">{d.gestion || "CIERRE"}</span>
                                    </td>
                                    <td className="py-5">
                                        <span className="text-[10px] text-[#608096] font-black uppercase">
                                            {d.nombre_n1_completo || (d.login_n1 === "POR_ASIGNAR" ? "PENDIENTE" : d.login_n1)}
                                        </span>
                                    </td>
                                    <td className="py-5 pr-4 text-right">
                                        <button
                                            onClick={() => {
                                                if(confirm("¿Deseas quitar este caso de tu historial?")) {
                                                    ocultarCaso(d.id);
                                                }
                                            }}
                                            className="p-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                            title="Quitar del historial"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-[10px] font-black text-[#608096] tracking-widest uppercase">
                                    No se encontraron registros para los filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default HistorialTable;
