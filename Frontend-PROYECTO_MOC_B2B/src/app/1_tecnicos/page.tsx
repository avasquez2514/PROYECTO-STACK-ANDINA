"use client";

/**
 * TecnicosPage Component
 * 
 * Este componente representa la interfaz de usuario para que los técnicos de campo
 * registren sus gestiones. Incluye un formulario dinámico que adapta sus campos
 * según el tipo de gestión y tecnología seleccionada.
 */

import React, { useState, useEffect } from "react";
import {
  X, Save, RotateCcw, Info, MapPin,
  User, Phone, Radio, Hash, MessageSquare,
  ChevronDown, FileText, HelpCircle, AlertCircle,
  Sun, Moon, Activity
} from "lucide-react";
import {
  plantillaCierreGPON,
  plantillaCierreHFC,
  plantillaCierreFIBRA,
  plantillaEnrutarGPON,
  plantillaEnrutarHFC,
  plantillaEnrutarFIBRA,
} from "../components/plantillas";
import PlantillaRender from "../components/PlantillaRender";

/**
 * Utilidad para concatenar clases condicionales
 */
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Definición de la interfaz para los funcionarios (técnicos)
 */
interface Funcionario {
  id: number;
  nombre_funcionario: string;
  cedula: string;
  celular: string;
}

// Opciones constantes para los selectores del formulario
const TABS = ["REPARACIONES", "INSTALACIONES"] as const;
const GESTIONES = ["CIERRE", "ENRUTAR", "SOPORTE", "ASESORIA"] as const;
const TECNOLOGIAS = ["GPON", "HFC", "FIBRA"] as const;
const OPCIONES_ASESORIA = ["PARAMETROS", "INFRAESTRUCTURA"] as const;

const TecnicosPage = () => {
  // --- ESTADOS LOCALES ---
  const [areaSeleccionada, setAreaSeleccionada] = useState<typeof TABS[number]>("REPARACIONES");
  const [gestion, setGestion] = useState<typeof GESTIONES[number]>("CIERRE");
  const [subAsesoria, setSubAsesoria] = useState("");
  const [tecnologia, setTecnologia] = useState("");

  const [enSitio, setEnSitio] = useState("");
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [torre, setTorre] = useState("");
  const [incidente, setIncidente] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [formExtra, setFormExtra] = useState<Record<string, string>>({});
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState<Funcionario | null>(null);

  const [hasMounted, setHasMounted] = useState(false);
  const [theme, setTheme] = useState("dark"); // 'dark' por defecto

  const torres = ["ANTIOQUIA CENTRO", "ANTIOQUIA ORIENTE", "ATLANTICO-MAGDALENA-CESAR-LA GUAJIRA", "BOLIVAR", "BOGOTÁ", "EDATEL", "SANTANDERES"];

  // --- EFECTOS ---
  useEffect(() => {
    setHasMounted(true); // Evita errores de hidratación en Next.js

    // Carga inicial de la lista de funcionarios desde la API
    const fetchFuncionarios = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/funcionarios/");
        const data = await res.json();
        setFuncionarios(data);
      } catch (error) {
        console.error("Error al cargar funcionarios:", error);
      }
    };
    fetchFuncionarios();
  }, []);

  /**
   * Cambia entre modo claro y oscuro
   */
  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  /**
   * Maneja el cambio de técnico seleccionado y auto-completa los campos relacionados
   */
  const handleFuncionarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idSeleccionado = parseInt(e.target.value, 10);
    const func = funcionarios.find((f) => f.id === idSeleccionado) || null;
    setFuncionarioSeleccionado(func);
    if (func) {
      setNombre(func.nombre_funcionario);
      setCelular(func.celular);
    }
  };

  /**
   * Resetea todos los campos del formulario a sus valores iniciales
   */
  const resetForm = () => {
    setEnSitio(""); setNombre(""); setCelular(""); setTorre("");
    setIncidente(""); setObservaciones(""); setFormExtra({});
    setFuncionarioSeleccionado(null); setTecnologia("");
    setSubAsesoria("");
  };

  /**
   * Procesa el envío del formulario al backend de soporte
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación para el tipo de gestión 'ASESORIA'
    if (gestion === "ASESORIA" && !subAsesoria) {
      alert("⚠️ Error: Debes seleccionar el TIPO DE ASESORÍA (Parámetros o Infraestructura).");
      return;
    }

    let datosPlantilla = { ...formExtra };
    let obsFinal = observaciones;

    // Inyección de sub-clasificación en la observación para asesorías
    if (gestion === "ASESORIA") {
      datosPlantilla = { ...datosPlantilla, clasificacion_asesoria: subAsesoria };
      obsFinal = `[ASESORÍA ${subAsesoria}] - ${observaciones}`;
    }

    const payload = {
      fecha_hora: new Date().toISOString(),
      en_sitio: enSitio === "SI",
      nombre: nombre,
      celular: celular,
      torre: torre,
      incidente: incidente,
      gestion: gestion,
      observaciones: obsFinal,
      plantilla: JSON.stringify(datosPlantilla),
      tipo_servicio: tecnologia,
      estado: "En gestión",
      login_n1: "POR_ASIGNAR", // Placeholder para el servidor que no acepta nulos/vacíos
      observaciones_ultima: "Registro inicial de gestión"
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/soporte/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("✅ Gestión guardada con éxito.");
        resetForm();
      } else {
        const errorData = await response.json();
        alert("❌ Error del servidor: " + JSON.stringify(errorData));
      }
    } catch (error) {
      alert("❌ Error de red: No se pudo conectar con el backend.");
    }
  };

  // Renderizado condicional para evitar saltos visuales durante la hidratación de React
  if (!hasMounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className={cn(
      "min-h-screen text-slate-200 relative overflow-x-hidden cyber-grid transition-colors duration-300",
      theme === "light" ? "light bg-slate-50 text-slate-900" : "bg-[#020617]"
    )}>
      {/* Background FX: Efectos de luces ambientales de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn(
          "absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse-slow",
          theme === "light" ? "bg-emerald-500/5" : "bg-emerald-500/10"
        )} />
        <div className={cn(
          "absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse-slow",
          theme === "light" ? "bg-blue-500/5" : "bg-blue-500/10"
        )} style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 p-4 md:p-8 max-w-[1200px] mx-auto space-y-8">

        {/* Formulario Principal de Registro */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-emerald-500/10 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div>
                <h3 className="text-xs font-black text-emerald-500 tracking-[0.4em] uppercase mb-2">MANAGEMENT TERMINAL</h3>
                <h2 className={cn("text-4xl font-black tracking-tighter uppercase italic", theme === "light" ? "text-slate-900" : "text-white")}>
                  Registro de <span className="text-emerald-500">Gestión</span>
                </h2>
              </div>
              <div className="flex gap-2 bg-slate-500/10 p-1 rounded-xl">
                {TABS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setAreaSeleccionada(area)}
                    className={cn(
                      "px-6 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest",
                      areaSeleccionada === area
                        ? "bg-emerald-500 text-slate-950 shadow-md"
                        : "text-slate-500 hover:text-emerald-500"
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-12" onSubmit={handleSubmit}>
              {/* Selector de Tipo de Gestión */}
              <div className="p-1 bg-slate-500/10 rounded-2xl border border-white/5 flex flex-wrap gap-1">
                {GESTIONES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { setGestion(g); setSubAsesoria(""); }}
                    className={cn(
                      "flex-1 px-8 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-[0.2em]",
                      gestion === g
                        ? "bg-emerald-500 text-slate-950 shadow-lg"
                        : "text-slate-500 hover:text-emerald-600"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Sección 1: Datos Operativos del Técnico */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-emerald-500 border-b border-white/5 pb-4">
                    <User size={20} />
                    <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em]", theme === "light" ? "text-slate-700" : "text-white")}>DATOS DEL TÉCNICO</h4>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">¿En Sitio?</label>
                      <div className="flex gap-2 p-1.5 bg-slate-500/5 rounded-xl border border-white/5">
                        {["SI", "NO"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setEnSitio(opt)}
                            className={cn(
                              "flex-1 py-2 text-[10px] font-black rounded-lg transition-all",
                              enSitio === opt ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-600 hover:text-emerald-500"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Torre Asignada</label>
                      <select
                        value={torre}
                        onChange={(e) => setTorre(e.target.value)}
                        className={cn(
                          "w-full px-5 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all appearance-none",
                          theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-white"
                        )}
                      >
                        <option value="">Seleccionar torre...</option>
                        {torres.map((t) => <option key={t} value={t} className={theme === "light" ? "bg-white" : "bg-slate-950"}>{t}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Técnico Responsable</label>
                      <select
                        value={funcionarioSeleccionado?.id || ""}
                        onChange={handleFuncionarioChange}
                        className={cn(
                          "w-full px-5 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all appearance-none",
                          theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-white"
                        )}
                      >
                        <option value="">Buscar en base de datos...</option>
                        {funcionarios.map((f) => (
                          <option key={f.id} value={f.id} className={theme === "light" ? "bg-white" : "bg-slate-950"}>{f.nombre_funcionario}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Celular de Contacto</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="text"
                          value={celular}
                          onChange={(e) => setCelular(e.target.value)}
                          className={cn(
                            "w-full pl-14 pr-6 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all",
                            theme === "light" ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" : "bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600"
                          )}
                          placeholder="300 000 0000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Detalles Técnicos del Servicio */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-emerald-500 border-b border-white/5 pb-4">
                    <FileText size={20} />
                    <h4 className={cn("text-[11px] font-black uppercase tracking-[0.2em]", theme === "light" ? "text-slate-700" : "text-white")}>DETALLES TÉCNICOS</h4>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Número de Incidente</label>
                      <div className="relative group">
                        <Hash className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="text"
                          value={incidente}
                          onChange={(e) => setIncidente(e.target.value)}
                          className={cn(
                            "w-full pl-14 pr-6 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all uppercase font-mono tracking-wider",
                            theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-emerald-400 font-bold"
                          )}
                          placeholder="INC00000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tecnología de Red</label>
                      <select
                        value={tecnologia}
                        onChange={(e) => { setTecnologia(e.target.value); setSubAsesoria(""); }}
                        className={cn(
                          "w-full px-5 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all appearance-none",
                          theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-white"
                        )}
                      >
                        <option value="">Seleccionar tecnología...</option>
                        {TECNOLOGIAS.map((t) => <option key={t} value={t} className={theme === "light" ? "bg-white" : "bg-slate-950"}>{t}</option>)}
                      </select>
                    </div>

                    {/* Selector extra condicionado a gestión 'ASESORIA' */}
                    {gestion === "ASESORIA" && tecnologia !== "" && (
                      <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-emerald-500 block mb-4 tracking-widest uppercase">Clasificación de Asesoría</label>
                        <select
                          value={subAsesoria}
                          onChange={(e) => setSubAsesoria(e.target.value)}
                          className={cn(
                            "w-full px-4 py-3 border border-emerald-500/30 rounded-xl text-xs font-bold focus:outline-none",
                            theme === "light" ? "bg-white text-slate-900" : "bg-slate-950 text-white"
                          )}
                        >
                          <option value="">-- SELECCIONAR --</option>
                          {OPCIONES_ASESORIA.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observaciones</label>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={4}
                        className={cn(
                          "w-full px-5 py-4 border rounded-2xl text-xs outline-none focus:border-emerald-500/50 transition-all resize-none",
                          theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950/50 border-white/10 text-slate-300"
                        )}
                        placeholder="Ingrese hallazgos..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Área Dinámica de Plantillas Técnicas */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-transparent blur opacity-25" />
                <div className="relative">
                  <PlantillaLogic
                    gestion={gestion}
                    tecnologia={tecnologia}
                    formExtra={formExtra}
                    setFormExtra={setFormExtra}
                    nombreTecnico={nombre}
                    numeroInc={incidente}
                  />
                </div>
              </div>

              {/* Botones de Acción Final */}
              <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t border-white/5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-5 text-[10px] font-black text-slate-500 bg-slate-500/5 hover:bg-rose-500/10 hover:text-rose-500 border border-white/10 rounded-2xl transition-all uppercase tracking-widest"
                >
                  <RotateCcw size={18} /> Limpiar Formulario
                </button>
                <button
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-4 px-10 py-5 text-xs font-black text-slate-950 bg-emerald-500 rounded-2xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-lg transition-all uppercase tracking-[0.2em]"
                >
                  <Save size={20} /> Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PlantillaLogic Component
 * 
 * Lógica auxiliar para decidir qué renderizador de plantilla mostrar
 * basándose en tecnología y gestión seleccionada.
 */
const PlantillaLogic = ({ gestion, tecnologia, formExtra, setFormExtra, nombreTecnico, numeroInc }: any) => {
  const props = { formExtra, setFormExtra, nombreTecnico, numeroInc };
  return (
    <div className="space-y-4 border-t border-white/5 pt-6 mt-6">
      {gestion === "CIERRE" && (
        <>
          {tecnologia === "GPON" && <PlantillaRender titulo="Plantilla Cierre GPON" campos={plantillaCierreGPON} {...props} />}
          {tecnologia === "HFC" && <PlantillaRender titulo="Plantilla Cierre HFC" campos={plantillaCierreHFC} {...props} />}
          {tecnologia === "FIBRA" && <PlantillaRender titulo="Plantilla Cierre FIBRA" campos={plantillaCierreFIBRA} {...props} />}
        </>
      )}
      {gestion === "ENRUTAR" && (
        <>
          {tecnologia === "GPON" && <PlantillaRender titulo="Plantilla Enrutar GPON" campos={plantillaEnrutarGPON} {...props} />}
          {tecnologia === "HFC" && <PlantillaRender titulo="Plantilla Enrutar HFC" campos={plantillaEnrutarHFC} {...props} />}
          {tecnologia === "FIBRA" && <PlantillaRender titulo="Plantilla Enrutar FIBRA" campos={plantillaEnrutarFIBRA} {...props} />}
        </>
      )}
    </div>
  );
};

export default TecnicosPage;