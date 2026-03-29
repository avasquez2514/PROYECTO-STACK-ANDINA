import React from "react";
import { Shield, Plus, Search, FileText, FileSpreadsheet } from "lucide-react";
import BotonPantallaCompleta from "./BotonPantallaCompleta";

interface AdminHeaderProps {
  activeTab: string;
  busqueda: string;
  setBusqueda: (v: string) => void;
  setModalConfig: (config: any) => void;
  exportToPDF: () => void;
  exportToExcel: () => void;
  hasMounted: boolean;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function CabeceraAdmin({
  activeTab,
  busqueda,
  setBusqueda,
  setModalConfig,
  exportToPDF,
  exportToExcel,
  hasMounted
}: AdminHeaderProps) {
  const getTabTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Panel de Control';
      case 'asesores': return 'Gestión de Asesores';
      case 'funcionarios': return 'Gestión de Funcionarios';
      case 'noticias': return 'Gestión de Novedades';
      case 'audit_logs': return 'Bitácora de Auditoría';
      default: return 'Control de Infraestructura';
    }
  };

  const showAddButton = hasMounted && (
    activeTab === 'asesores' || 
    activeTab === 'funcionarios' || 
    activeTab === 'noticias'
  );

  const getAddButtonText = () => {
    if (activeTab === 'asesores') return 'AGENT';
    if (activeTab === 'funcionarios') return 'OFFICIAL';
    if (activeTab === 'noticias') return 'NEWS';
    return 'RECORD';
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between bg-[#040912] border-b border-white/5 z-20 shadow-2xl shrink-0 overflow-hidden">
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
          <Shield size={22} className="text-blue-500" />
          <h1 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none">
            ADMIN<span className="text-blue-400">MOC</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <h2 className="text-[17px] font-black italic tracking-tight text-white uppercase leading-none whitespace-nowrap">
            {getTabTitle()}
          </h2>
          <div className="px-2.5 py-0.5 bg-blue-600/10 border border-blue-600/20 rounded-full shrink-0">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Live Update</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 shrink-0">
        {showAddButton && (
          <button
            onClick={() => setModalConfig({
              type: activeTab === 'noticias' ? 'noticia' : (activeTab === 'asesores' ? 'asesor' : 'funcionario'),
              mode: 'add'
            })}
            className="px-6 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> ADD NEW {getAddButtonText()}
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
          <button 
            onClick={exportToPDF} 
            className="w-9 h-9 bg-[#FF2D55] text-white rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={exportToExcel} 
            className="w-9 h-9 bg-[#00C38A] text-white rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <FileSpreadsheet size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-4 shrink-0 border-l border-white/10">
        <BotonPantallaCompleta />
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
  );
}
