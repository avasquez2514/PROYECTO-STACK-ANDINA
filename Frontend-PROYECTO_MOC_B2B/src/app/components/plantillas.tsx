/**
 * Definiciones de Plantillas Técnicas
 * 
 * Este archivo contiene las estructuras de campos para los diferentes tipos de gestión
 * (Cierre o Enrutar) segmentados por tecnología (GPON, HFC, FIBRA).
 * Estas plantillas son utilizadas por el componente PlantillaRender para generar
 * formularios dinámicos.
 */

export const plantillaCierreGPON = [
  { label: "Fecha", type: "date" },
  { label: "Inc", type: "text" },
  { label: "Reparador", type: "text" },
  { label: "Equipo Sn/Mac", type: "text" },
  { label: "Nombre del contacto en sitio", type: "text" },
  { label: "Teléfono", type: "tel" },
  { label: "Reparación de red externa", type: "text" },
  { label: "Cambio de Drop (cantidad de metros)", type: "text" },
  { label: "Cierre lineal", type: "text" },
  { label: "Conector Óptico", type: "text" },
  { label: "Empalme mecánico", type: "text" },
  { label: "Cantidad de metros de cable instalados", type: "text" },
  { label: "Paso de vías (obstáculos encontrados)", type: "text" },
  { label: "Paso de cámaras (selladas, inundaciones, daños en cableado)", type: "text" },
  { label: "Configuración ONT (Vlan, cambio, puerto)", type: "text" },
  { label: "Tiempo de reparación", type: "text" },
  { label: "Motivo de demora si es más de 2 horas", type: "text" },
  { label: "Actividad realizada", type: "textarea" },
];

export const plantillaCierreHFC = [
  { label: "Fecha", type: "date" },
  { label: "Inc", type: "text" },
  { label: "Reparador", type: "text" },
  { label: "Equipo Sn/Mac", type: "text" },
  { label: "Nombre del contacto en sitio", type: "text" },
  { label: "Teléfono", type: "tel" },
  { label: "Actividad realizada", type: "textarea" },
];

export const plantillaCierreFIBRA = [...plantillaCierreHFC];

export const plantillaEnrutarGPON = [
  { label: "Fecha", type: "date" },
  { label: "Inc", type: "text" },
  { label: "Reparador", type: "text" },
  { label: "Equipo Sn/Mac", type: "text" },
  { label: "Nombre del contacto en sitio", type: "text" },
  { label: "Teléfono", type: "tel" },
  { label: "Disponibilidad del Cliente", type: "text" },
  { label: "Dirección Cliente", type: "text" },
  { label: "Dirección NAP", type: "text" },
  { label: "Ciudad", type: "text" },
  { label: "OLT", type: "text" },
  { label: "ARPON", type: "text" },
  { label: "NAP", type: "text" },
  { label: "HILO NAP", type: "text" },
  { label: "POTENCIA NAP (1490)", type: "text" },
  { label: "Actividad realizada", type: "textarea" },
];

export const plantillaEnrutarHFC = [
  { label: "Fecha", type: "date" },
  { label: "Inc", type: "text" },
  { label: "Reparador", type: "text" },
  { label: "Equipo Sn/Mac", type: "text" },
  { label: "Nombre del contacto en sitio", type: "text" },
  { label: "Teléfono", type: "tel" },
  { label: "Disponibilidad del Cliente", type: "text" },
  { label: "Dirección", type: "text" },
  { label: "Ciudad", type: "text" },
  { label: "TIPO DE TAP", type: "text" },
  { label: "NUMERO", type: "text" },
  { label: "RF ALTOS:     BA (120/135)", type: "text" },
  { label: "RF BAJOS:     BA (2/14/28 RPHY)", type: "text" },
  { label: "CANALES TV 89-45-61", type: "text" },
  { label: "POTENCIA EN UP", type: "text" },
  { label: "POTENCIA EN DOW", type: "text" },
  { label: "MER", type: "text" },
  { label: "BER", type: "text" },
  { label: "DQI", type: "text" },
];

export const plantillaEnrutarFIBRA = [
  { label: "Fecha", type: "date" },
  { label: "Inc", type: "text" },
  { label: "Reparador", type: "text" },
  { label: "Equipo Sn/Mac", type: "text" },
  { label: "Nombre del contacto en sitio", type: "text" },
  { label: "Teléfono", type: "tel" },
  { label: "Cambio Módulo Óptico - Nodo (tipo de SFP instalado)", type: "text" },
  { label: "Cambio - Limpieza Módulo Óptico Switch (tipo de SFP instalado)", type: "text" },
  { label: "Actividad realizada", type: "textarea" },
];
