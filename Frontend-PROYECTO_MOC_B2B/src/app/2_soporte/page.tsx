"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  X, Search, ClipboardList, FileText,
  ChevronDown, Zap, MessageSquare, Copy,
  Activity, LayoutDashboard, CheckCircle2, AlertCircle, Clock, Image as ImageIcon, Megaphone
} from "lucide-react";
import VentanaChat from "../components/VentanaChat";
import CronometroEnVivo from "../components/CronometroEnVivo";
import PanelNoticias from "../components/PanelNoticias";
import EsqueletoCarga from "../components/EsqueletoCarga";
import BotonPantallaCompleta from "../components/BotonPantallaCompleta";
import TarjetasKPI from "../components/TarjetasKPI";
import SidebarAsesores from "../components/SidebarAsesores";
import TablaSoporte from "../components/TablaSoporte";
import ModalSoporte from "../components/ModalSoporte";
import { Soporte, AsesorSoporte, Noticia } from "../../types";
import { decodificarObservaciones, formatearFecha, formatearPlantilla } from "../../utils/formatters";
import { toast } from "sonner";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente Principal `SoportePage`
 * 
 * Console principal destinada al equipo de Soporte (Nivel 1).
 * Similar al tablero de despacho, pero posee permisos absolutos de edición:
 * Permite reasignar tickets, forzar el control del status (en gestión, resuelto),
 * interactuar en el Chat bidireccional y modificar plantillas técnicas en vivo.
 * 
 * @returns {JSX.Element} Aplicativo completo / vista de Soporte.
 */
export default function SoportePage() {
  const [datos, setDatos] = useState<Soporte[]>([]);
  const [asesoresSoporte, setAsesoresSoporte] = useState<AsesorSoporte[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loggedUser, setLoggedUser] = useState("AVASQUEZ"); // Mock or from context
  const [loading, setLoading] = useState(true);

  // Chat State
  const [activeChatSoporteId, setActiveChatSoporteId] = useState<number | null>(null);
  const [activeChatIncidente, setActiveChatIncidente] = useState<string>("");

  const [modalConfig, setModalConfig] = useState<{ id: number; text: string; title: string; evidencias?: string[] } | null>(null);

  // Live Timer State removed to optimize renders

  // Dropdown States
  const [openDropdownId, setOpenDropdownId] = useState<{ id: number; type: 'login' | 'estado' } | null>(null);
  const [openAdvisorDropdown, setOpenAdvisorDropdown] = useState<number | null>(null);
  const [noticia, setNoticia] = useState<Noticia | null>(null);

  // Global timer effect removed to avoid full table re-renders

  useEffect(() => {
    setHasMounted(true);
    cargarDatos();
    cargarAsesores();
    cargarNoticia();

    const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/updates/`);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.model === 'soporte') cargarDatos();
      if (data.model === 'asesor') cargarAsesores();
      if (data.model === 'noticia') cargarNoticia();
    };

    return () => socket.close();
  }, []);

  /**
   * Refresco sincrono general de la tabla principal de Soportes (Incidentes).
   * Ordena y renderiza desde el ID más antiguo al más nuevo.
   */
  const cargarDatos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`);
      const json = await res.json();
      setDatos(json.sort((a: Soporte, b: Soporte) => a.id - b.id));
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const cargarAsesores = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/`);
      const data = await res.json();
      setAsesoresSoporte(data);
    } catch (e) { console.error(e); }
  };

  const cargarNoticia = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/noticias/`);
      const data = await res.json();
      const activa = data.find((n: Noticia) => n.activa);
      setNoticia(activa || null);
    } catch (e) { console.error(e); }
  };

  /**
   * Endpoint PATCH de modificación integral de Incidentes.
   * Usado para alterar el dropwdown local de estado y reasignación de LoginN1.
   * @param {number} id - Clave primaria (PK)
   * @param {string} field - Propiedad a modificar. E.X. `login_n1`
   * @param {any} value - Transición de valor final a inyectar
   */
  const actualizarSoporte = async (id: number, field: string, value: any) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value, admin_user: loggedUser }),
      });
    } catch (e) { console.error(e); }
  };

  const handleCambioEstadoAsesor = async (id: number, nuevoEstado: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, admin_user: loggedUser }),
      });
    } catch (e) { console.error(e); }
  };

  const datosFiltrados = datos.filter(d =>
    !busqueda || d.incidente?.toLowerCase().includes(busqueda.toLowerCase()) || d.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!hasMounted) return <div className="min-h-screen bg-[#060d14]" />;

  return (
    <div className="min-h-screen font-sans selection:bg-[#00e5a0]/30 overflow-hidden flex flex-col relative transition-colors duration-500 bg-[#060d14] text-white">
      {/* Background Decor Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 transition-opacity duration-1000 opacity-40"
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

      <div className="relative z-10 flex h-screen">
        <SidebarAsesores 
          asesoresSoporte={asesoresSoporte}
          openAdvisorDropdown={openAdvisorDropdown}
          setOpenAdvisorDropdown={setOpenAdvisorDropdown}
          handleCambioEstadoAsesor={handleCambioEstadoAsesor}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <header className="h-20 lg:h-24 border-b flex items-center justify-between px-4 lg:px-10 shrink-0 backdrop-blur-xl transition-all duration-500 border-[#152233] bg-[#0b1621]/60">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase drop-shadow-md text-white">
                TERMINAL DE <span className="text-[#00e5a0]">SOPORTE</span>
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#00e5a0]/10 border border-[#00e5a0]/30 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] shadow-[0_0_8px_#00e5a0]" />
                <span className="text-[8px] font-black text-[#00e5a0] tracking-widest uppercase">Live System</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4 lg:mx-12 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00b8e5] group-focus-within:text-[#00e5a0] transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR CASO POR INCIDENTE..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full border rounded-2xl py-4 pl-16 pr-6 text-[10px] font-black tracking-[0.2em] outline-none transition-all uppercase placeholder:text-[#3a5c72] bg-[#060d14] border-[#152233] text-white focus:border-[#00e5a0]/50 focus:shadow-[0_0_20px_rgba(0,229,160,0.1)]"
              />
            </div>

            <div className="flex items-center gap-4">
              <BotonPantallaCompleta />
            </div>

          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 custom-scrollbar relative">
            {/* Noticia Panel Section */}
            <PanelNoticias noticia={noticia} />

            {/* Stats Cards Section */}
            <TarjetasKPI datos={datos} />

            {/* Main Table Section */}
            <TablaSoporte 
              loading={loading}
              datosFiltrados={datosFiltrados}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              asesoresSoporte={asesoresSoporte}
              actualizarSoporte={actualizarSoporte}
              setActiveChatSoporteId={setActiveChatSoporteId}
              setActiveChatIncidente={setActiveChatIncidente}
              setModalConfig={setModalConfig}
            />
          </div>
        </main>
      </div>

      {/* VISOR MODAL */}
      <ModalSoporte 
        modalConfig={modalConfig}
        setModalConfig={setModalConfig}
        actualizarSoporte={actualizarSoporte}
      />

      {/* CHAT WINDOW */}
      {activeChatSoporteId !== null && (
        <VentanaChat
          soporteId={activeChatSoporteId}
          incidente={activeChatIncidente}
          remitenteActual={"SOPORTE"}
          nombreRemitente={loggedUser}
          onClose={() => setActiveChatSoporteId(null)}
        />
      )}
    </div>
  );
}