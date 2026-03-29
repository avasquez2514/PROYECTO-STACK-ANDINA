import React from 'react';
import { X, ClipboardList, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface SoporteModalProps {
  modalConfig: { id: number; text: string; title: string; evidencias?: string[] } | null;
  setModalConfig: (config: { id: number; text: string; title: string; evidencias?: string[] } | null) => void;
  actualizarSoporte: (id: number, field: string, value: any) => Promise<void>;
  readOnly?: boolean;
}

export default function ModalSoporte({ modalConfig, setModalConfig, actualizarSoporte, readOnly = false }: SoporteModalProps) {
  if (!modalConfig) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-in fade-in p-8 bg-[#060d14]/80">
      <div className="border rounded-[3rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] hud-corners transition-all duration-500 bg-[#0b1621] border-[#152233]">
        <div className="p-10 border-b flex justify-between items-center transition-colors duration-500 border-white/5 bg-[#060d14]/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border rounded-2xl flex items-center justify-center transition-colors bg-[#00b8e5]/10 border-[#00b8e5]/30 text-[#00b8e5]">
              <ClipboardList size={24} />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-lg transition-colors text-white">{modalConfig.title}</h2>
          </div>
          <button onClick={() => setModalConfig(null)} className="p-4 rounded-2xl border transition-all bg-[#060d14] hover:bg-rose-500/10 text-white hover:text-rose-500 border-[#152233]">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 p-10 overflow-hidden flex flex-col gap-6">
          <p className="text-[10px] font-black text-[#00b8e5] uppercase tracking-[0.4em] opacity-80">CONTENIDO ESTRUCTURADO REGISTRADO</p>
          <div className="flex-1 p-10 rounded-[2.5rem] border shadow-inner overflow-hidden flex flex-col transition-colors duration-500 bg-[#060d14] border-white/5">
            <textarea
              className="w-full flex-1 bg-transparent text-base font-bold font-mono whitespace-pre-wrap leading-relaxed outline-none resize-none custom-scrollbar transition-colors text-white disabled:opacity-70"
              value={modalConfig.text}
              onChange={(e) => setModalConfig({ ...modalConfig, text: e.target.value })}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          {modalConfig.evidencias && modalConfig.evidencias.length > 0 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-[#00e5a0] uppercase tracking-[0.4em] opacity-80 flex items-center gap-2">
                <ImageIcon size={14} /> EVIDENCIAS FOTOGRÁFICAS (TÉCNICO)
              </p>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {modalConfig.evidencias.map((img, idx) => (
                  <div key={idx} className="shrink-0 group relative overflow-hidden rounded-2xl border border-white/5 h-32 w-32 shadow-2xl">
                    <img src={img} className="h-full w-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500" onClick={() => window.open(img)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(modalConfig.text);
                toast.success("Copiado al portapapeles");
              }}
              className="flex-1 py-5 border-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 bg-[#0b1621] border-[#00b8e5]/40 text-[#00b8e5] hover:bg-[#00b8e5] hover:text-[#061511] shadow-[0_0_20px_rgba(0,184,229,0.1)]"
            >
              Copiar información
            </button>
            {!readOnly && (
              <button
                onClick={async () => {
                  await actualizarSoporte(modalConfig.id, "plantilla", modalConfig.text);
                  setModalConfig(null);
                }}
                className="flex-1 py-5 bg-gradient-to-r from-[#00e5a0] to-[#00b8e5] text-[#061511] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(0,229,160,0.3)] hover:shadow-[0_0_40px_rgba(0,229,160,0.5)]"
              >
                Guardar Cambios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
