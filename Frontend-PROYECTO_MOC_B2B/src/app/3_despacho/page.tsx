"use client";

import React, { useEffect, useState } from "react";
import VentanaChat from "../components/VentanaChat";
import PanelNoticias from "../components/PanelNoticias";
import BotonPantallaCompleta from "../components/BotonPantallaCompleta";
import SidebarAsesores from "../components/SidebarAsesores";
import TarjetasKPI from "../components/TarjetasKPI";
import TablaSoporte from "../components/TablaSoporte";
import ModalSoporte from "../components/ModalSoporte";
import { Search, Megaphone, Clock } from "lucide-react";
import { Soporte, AsesorSoporte, Noticia } from "../../types";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Componente Principal `DespachoPage`
 * 
 * Interfaz de consola enfocada en el rol de "DESPACHO".
 * Este panel permite monitorear de forma pasiva (readOnly) todas las gestiones
 * reportadas por los técnicos y el estado de los asesores, además de visualizar alertas y usar el chat.
 * 
 * Soporta WebSockets para la actualización en tiempo real de gestiones, asesores y noticias.
 * 
 * @returns {JSX.Element} Vista renderizada del dashboard de Despacho.
 */
export default function DespachoPage() {
  const [datos, setDatos] = useState<Soporte[]>([]);
  const [asesoresSoporte, setAsesoresSoporte] = useState<AsesorSoporte[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggedUser] = useState("DESPACHO");

  // State for components
  const [openAdvisorDropdown, setOpenAdvisorDropdown] = useState<number | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<{ id: number; type: 'login' | 'estado' } | null>(null);
  const [modalConfig, setModalConfig] = useState<{ id: number; text: string; title: string; evidencias?: string[] } | null>(null);
  const [activeChatSoporteId, setActiveChatSoporteId] = useState<number | null>(null);
  const [activeChatIncidente, setActiveChatIncidente] = useState<string>("");
  const [noticia, setNoticia] = useState<Noticia | null>(null);

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
   * Obtiene la nómina de todos los incidentes de soporte registrados.
   * Ordenados por ID de manera ascendente. 
   */
  const cargarDatos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/`);
      const json = await res.json();
      setDatos(json.sort((a: any, b: any) => a.id - b.id));
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  /**
   * Refleja cambios en el estado de una gestión (resolviendo llamadas a la API vía PATCH).
   * @param {number} id - Identificador de la gestión.
   * @param {string} field - Propiedad del modelo a modificar.
   * @param {any} value - Valor nuevo a asignar.
   */
  const handleUpdateSoporte = async (id: number, field: string, value: any) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/soporte/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value, admin_user: "DESPACHO" }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Carga la lista completa de asesores y su estado operativo actual.
   */
  const cargarAsesores = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/`);
      const data = await res.json();
      setAsesoresSoporte(data);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Modifica el estado actual de un asesor conectado (Ej. Disponible, Break, etc.).
   * @param {number} id - ID del asesor en la base de datos.
   * @param {string} nuevoEstado - Etiqueta asignada como estado actual.
   */
  const handleCambioEstadoAsesor = async (id: number, nuevoEstado: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/asesores/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const cargarNoticia = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/noticias/`);
      const data = await res.json();
      const activa = data.find((n: Noticia) => n.activa);
      setNoticia(activa || null);
    } catch (e) {
      console.error(e);
    }
  };

  const datosFiltrados = datos.filter(d =>
    d.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.torre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.incidente && d.incidente.toLowerCase().includes(busqueda.toLowerCase()))
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
        {/* Sidebar de Asesores */}
        <SidebarAsesores
          asesoresSoporte={asesoresSoporte}
          openAdvisorDropdown={openAdvisorDropdown}
          setOpenAdvisorDropdown={setOpenAdvisorDropdown}
          handleCambioEstadoAsesor={handleCambioEstadoAsesor}
          variant="amber"
          readOnly={true}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Header */}
          <header className="h-20 lg:h-24 border-b flex items-center justify-between px-4 lg:px-10 shrink-0 backdrop-blur-xl transition-all duration-500 border-[#152233] bg-[#0b1621]/60">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-black tracking-tighter italic uppercase drop-shadow-md text-white">
                CONSOLA <span className="text-amber-400">DESPACHO</span>
              </h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <span className="text-[8px] font-black text-amber-400 tracking-widest uppercase">Live System</span>
              </div>
            </div>

            <div className="flex-1 max-w-2xl mx-4 lg:mx-12 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="text"
                placeholder="BUSCAR CASO POR INCIDENTE..."
                autoComplete="off"
                className="w-full border rounded-2xl py-4 pl-16 pr-6 text-[10px] font-black tracking-[0.2em] outline-none transition-all uppercase placeholder:text-[#3a5c72] bg-[#060d14] border-[#152233] text-white focus:border-[#00e5a0]/50 focus:shadow-[0_0_20px_rgba(0,229,160,0.1)]"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <BotonPantallaCompleta />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 custom-scrollbar relative">
            {/* Noticia Panel Section */}
            {noticia && <PanelNoticias noticia={noticia} variant="amber" />}

            {/* Stats Cards Section */}
            <TarjetasKPI datos={datos} />

            {/* Main Table Section */}
            <TablaSoporte
              loading={loading}
              datosFiltrados={datosFiltrados}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              asesoresSoporte={asesoresSoporte}
              actualizarSoporte={handleUpdateSoporte}
              setActiveChatSoporteId={setActiveChatSoporteId}
              setActiveChatIncidente={setActiveChatIncidente}
              setModalConfig={setModalConfig}
              variant="emerald"
              showPrioridad={true}
              readOnly={true}
            />
          </div>
        </main>
      </div>

      {/* VISOR MODAL */}
      <ModalSoporte
        modalConfig={modalConfig}
        setModalConfig={setModalConfig}
        actualizarSoporte={async (id, f, v) => handleUpdateSoporte(id, f, v)}
        readOnly={true}
      />

      {/* CHAT WINDOW */}
      {activeChatSoporteId && (
        <VentanaChat 
          soporteId={activeChatSoporteId} 
          incidente={activeChatIncidente} 
          remitenteActual={loggedUser} 
          onClose={() => setActiveChatSoporteId(null)} 
        />
      )}
    </div>
  );
}
