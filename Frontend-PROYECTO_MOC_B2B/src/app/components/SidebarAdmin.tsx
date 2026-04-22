import React from "react";
import { 
  Shield, BarChart3, Users, UserCheck, History, Database, 
  Megaphone, ClipboardList, Sun, Moon, Trash2 
} from "lucide-react";

/**
 * Propiedades del componente SidebarAdmin.
 * @interface AdminSidebarProps
 */
interface AdminSidebarProps {
  /** Tab que se encuentra activo actualmente. */
  activeTab: string;
  /** Función para conmutar el tab activo. */
  setActiveTab: (tab: string) => void;
  /** Valor del tema visual. */
  theme: string;
  /** Función para alternar entre dark y light mode. */
  setTheme: (theme: string) => void;
  /** Callback para liquidar la sesión. */
  handleLogout: () => void;
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente SidebarAdmin
 * 
 * Navegación lateral persistente para la vista de Administrador.
 * Agrupa los accesos directos a Dashboard, Gestión de Usuarios, Históricos y Auditoría.
 * También aloja el switch de tema y el botón de salida.
 * 
 * @param {AdminSidebarProps} props
 */
export default function SidebarAdmin({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  handleLogout
}: AdminSidebarProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard Real-Time", icon: BarChart3 },
    { id: "asesores", label: "Gestión de Asesores", icon: Users },
    { id: "funcionarios", label: "Gestión Funcionarios", icon: UserCheck },
    { id: "historico_asesores", label: "Histórico de Asesores", icon: History },
    { id: "soportes", label: "Histórico de Incidentes", icon: Database },
    { id: "noticias", label: "Panel de Noticias", icon: Megaphone },
    { id: "audit_logs", label: "Bitácora de Auditoría", icon: ClipboardList },
  ];

  return (
    <aside className="w-[280px] flex flex-col bg-[#040912] text-slate-300 shrink-0 z-20 shadow-xl shadow-black/10">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
            <Shield size={24} fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">
              ADMIN<span className="text-blue-400">MOC</span>
            </h1>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 leading-none">
              Infrastructure Control
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => (
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
            <tab.icon 
              size={18} 
              className={cn(activeTab === tab.id ? "text-white" : "text-slate-500 group-hover:text-slate-200")} 
            />
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
  );
}
