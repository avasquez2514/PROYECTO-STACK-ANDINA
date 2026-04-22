import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Funcionario } from "../../types";

/**
 * Propiedades del componente PestanaFuncionariosAdmin.
 * @interface AdminTabFuncionariosProps
 */
interface AdminTabFuncionariosProps {
  /** Array de funcionarios/técnicos registrados en la plataforma. */
  funcionarios: Funcionario[];
  /** String de búsqueda para filtrar por nombre. */
  busqueda: string;
  /** Hook para configuración de modales CRUD. */
  setModalConfig: (config: any) => void;
  /** Callback para ejecutar operaciones sobre la API de funcionarios. */
  handleAction: (endpoint: string, method: string, id?: number, data?: any) => Promise<void>;
}

/**
 * Componente PestanaFuncionariosAdmin
 * 
 * Interfaz de administración para los usuarios finales (Funcionarios/Técnicos).
 * Permite visualizar el listado completo, incluyendo sus credenciales (password)
 * para soporte administrativo y acciones de edición o retiro del sistema.
 * 
 * @param {AdminTabFuncionariosProps} props
 */
export default function PestanaFuncionariosAdmin({
  funcionarios,
  busqueda,
  setModalConfig,
  handleAction
}: AdminTabFuncionariosProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="glass-panel rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#060d14] text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-b border-white/5 shadow-xl">
            <tr>
              <th className="px-8 py-6">ID</th>
              <th className="px-8 py-6">NOMBRE COMPLETO</th>
              <th className="px-8 py-6">CÉDULA CIUDADANÍA</th>
              <th className="px-8 py-6">CELULAR CONTACTO</th>
              <th className="px-8 py-6">CONTRASEÑA</th>
              <th className="px-8 py-6 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-bold">
            {funcionarios.filter(f => !busqueda || f.nombre_funcionario.toUpperCase().includes(busqueda.toUpperCase())).map((f) => (
              <tr key={f.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                <td className="px-8 py-5 text-slate-500 font-mono">#{f.id}</td>
                <td className="px-8 py-5 uppercase font-black">{f.nombre_funcionario}</td>
                <td className="px-8 py-5 text-blue-500">{f.cedula}</td>
                <td className="px-8 py-5">{f.celular || '---'}</td>
                <td className="px-8 py-5 text-emerald-500 font-mono italic">{f.password || '---'}</td>
                <td className="px-8 py-5">
                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setModalConfig({ type: 'funcionario', mode: 'edit', data: f })} 
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => { if (confirm('¿ELIMINAR FUNCIONARIO?')) handleAction('funcionarios', 'DELETE', f.id) }} 
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
