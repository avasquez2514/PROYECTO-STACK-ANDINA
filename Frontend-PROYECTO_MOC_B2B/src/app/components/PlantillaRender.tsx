"use client";

/**
 * PlantillaRender Component
 * 
 * Este componente se encarga de renderizar dinámicamente campos de entrada (input/textarea)
 * basados en una "plantilla" (array de objetos Campo).
 * Gestiona el rellenado automático de campos comunes como Fecha, Incidente y Reparador.
 */

import React, { useEffect } from "react";

/**
 * Representa la definición de un campo individual en la plantilla
 */
type Campo = {
  label: string;
  type: string;
};

/**
 * Propiedades del componente PlantillaRender
 * @param titulo Nombre de la plantilla (ej: 'Plantilla Cierre GPON')
 * @param campos Array con la definición de etiquetas y tipos de input
 * @param formExtra Objeto de estado que almacena los valores de la plantilla
 * @param setFormExtra Función para actualizar el estado superior
 * @param nombreTecnico Nombre del técnico (para pre-llenado)
 * @param numeroInc Número de incidente (para pre-llenado)
 */
const PlantillaRender = ({
  titulo,
  campos,
  formExtra,
  setFormExtra,
  nombreTecnico,
  numeroInc,
}: {
  titulo: string;
  campos: Campo[];
  formExtra: Record<string, string>;
  setFormExtra: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  nombreTecnico?: string;
  numeroInc?: string;
}) => {
  const today = new Date().toISOString().split("T")[0];

  // Efecto para sincronizar datos globales del formulario con la plantilla técnica específica
  useEffect(() => {
    const updates: Record<string, string> = {};
    updates["Fecha"] = today;

    // Auto-completar Incidente con nombre del técnico para facilitar lectura
    if (numeroInc && nombreTecnico) {
      updates["Inc"] = `${numeroInc} - ${nombreTecnico}`;
    }

    // Auto-completar Reparador
    if (nombreTecnico) {
      updates["Reparador"] = nombreTecnico;
    }

    // Actualización masiva del estado para evitar múltiples re-renders
    setFormExtra(prev => ({ ...prev, ...updates }));
  }, [nombreTecnico, numeroInc, today, setFormExtra]);

  return (
    <div className="space-y-6 bg-[#0A120E]/50 p-6 rounded-2xl border border-[#1A2E26] shadow-inner">
      {/* Título de la Plantilla con acento esmeralda */}
      <h2 className="text-sm font-black uppercase tracking-[3px] text-[#10b981] border-b border-[#1A2E26] pb-3">
        {titulo}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campos.map((campo) => (
          <div key={campo.label} className={campo.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="block text-[10px] font-bold text-shadow-gray-50 uppercase tracking-wider mb-2 ml-1">
              {campo.label}
            </label>

            {/* Renderizado condicional según el tipo de campo definido en la plantilla */}
            {campo.type === "textarea" ? (
              <textarea
                className="w-full p-3 bg-[#050A08] border border-[#1A2E26] rounded-xl text-sm text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/30 transition-all resize-none"
                rows={4}
                value={formExtra[campo.label] || ""}
                onChange={(e) =>
                  setFormExtra({ ...formExtra, [campo.label]: e.target.value })
                }
              />
            ) : (
              <input
                type={campo.type}
                className={`w-full p-3 bg-[#050A08] border border-[#1A2E26] rounded-xl text-sm transition-all focus:outline-none focus:border-[#10b981] ${campo.label === "Fecha"
                    ? "text-shadow-gray-50 cursor-not-allowed border-dashed"
                    : "text-shadow-gray-50"
                  } ${(campo.label === "Inc" || campo.label === "Reparador") && "text-[#10b981] font-medium"
                  }`}
                value={
                  campo.label === "Fecha"
                    ? formExtra[campo.label] || today
                    : formExtra[campo.label] || ""
                }
                onChange={(e) =>
                  setFormExtra({ ...formExtra, [campo.label]: e.target.value })
                }
                readOnly={campo.label === "Fecha"} // La fecha es automática y no editable
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlantillaRender;