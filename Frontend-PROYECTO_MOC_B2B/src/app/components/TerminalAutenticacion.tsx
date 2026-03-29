"use client";

import React, { useState } from "react";
import { User, Lock, Monitor, Zap } from "lucide-react";

interface AuthTerminalProps {
  onLoginSuccess: (user: any) => void;
  showNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function TerminalAutenticacion({ onLoginSuccess, showNotify }: AuthTerminalProps) {
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [authForm, setAuthForm] = useState({
    cedula: "",
    password: "",
    nombre: "",
    celular: ""
  });
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (authMode === "REGISTER") {
      if (!authForm.cedula || !authForm.nombre || !authForm.password) {
        showNotify("Por favor, complete los campos obligatorios.", "error");
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/funcionarios/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cedula: authForm.cedula,
            password: authForm.password,
            nombre_funcionario: authForm.nombre.toUpperCase(),
            celular: authForm.celular
          })
        });

        if (res.ok) {
          showNotify("REGISTRO EXITOSO. AHORA PUEDES INGRESAR.", "success");
          setAuthMode("LOGIN");
          setAuthForm({ ...authForm, password: "" });
        } else {
          const errorData = await res.json();
          let msg = "ERROR AL REGISTRAR";
          if (errorData.nombre_funcionario) msg = "EL NOMBRE YA ESTÁ REGISTRADO";
          if (errorData.cedula) msg = "LA CÉDULA YA ESTÁ REGISTRADA";
          showNotify(msg, "error");
        }
      } catch (error) {
        showNotify("ERROR DE CONEXIÓN AL BACKEND.", "error");
      }
    } else {
      if (!authForm.cedula || !authForm.password) {
        showNotify("Por favor ingrese cédula y contraseña.", "error");
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/funcionarios/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cedula: authForm.cedula,
            password: authForm.password
          })
        });

        if (res.ok) {
          const user = await res.json();
          localStorage.setItem("phoenix_tech_user", JSON.stringify(user));
          onLoginSuccess(user);
        } else {
          const errorData = await res.json();
          showNotify(errorData.error || "ERROR EN LAS CREDENCIALES", "error");
        }
      } catch (error) {
        showNotify("ERROR DE CONEXIÓN AL BACKEND.", "error");
      }
    }

    setAuthLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060d14] font-sans flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-40 transition-opacity duration-1000"
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

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-[#0b1621] border border-[#152233] p-10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center">
          <div className="w-20 h-20 border-2 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(0,229,160,0.2)] bg-[#060d14] border-[#00e5a0] text-[#00e5a0]">
            <Zap size={36} fill="currentColor" className="opacity-90" />
          </div>

          <div className="text-center mb-10 space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">BIENVENIDO A<br /><span className="text-[#00e5a0] text-4xl font-[900]">SIMOC</span></h2>
            <p className="text-[10px] text-[#608096] font-bold uppercase tracking-[0.4em] opacity-80">TERMINAL DE GESTIÓN</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="w-full space-y-6">
            {authMode === "REGISTER" && (
              <>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">NOMBRE COMPLETO</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                    <input
                      type="text"
                      required
                      value={authForm.nombre}
                      onChange={(e) => setAuthForm({ ...authForm, nombre: e.target.value })}
                      className="w-full bg-white text-[#060d14] text-xs font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400"
                      placeholder="Nombres y apellidos"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CELULAR (OPCIONAL)</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                    <input
                      type="text"
                      value={authForm.celular}
                      onChange={(e) => setAuthForm({ ...authForm, celular: e.target.value })}
                      className="w-full bg-white text-[#060d14] text-xs font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400"
                      placeholder="Ej. 300 000 0000"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CÉDULA DE IDENTIDAD</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                <input
                  type="text"
                  required
                  value={authForm.cedula}
                  onChange={(e) => setAuthForm({ ...authForm, cedula: e.target.value })}
                  className="w-full bg-white text-[#060d14] text-sm font-bold px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400 shadow-inner"
                  placeholder="452547"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-[#608096] uppercase tracking-widest pl-1">CONTRASEÑA DE ACCESO</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#608096]" />
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-white text-[#060d14] text-sm font-black px-12 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-[#00e5a0]/20 transition-all placeholder:text-slate-400 shadow-inner"
                  placeholder="••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-4 bg-[#061511] hover:bg-[#0a231a] border-2 border-[#00e5a0]/80 text-white text-[11px] font-[900] uppercase tracking-[0.2em] py-5 rounded-2xl mt-10 transition-all shadow-[0_0_30px_rgba(0,229,160,0.1)] hover:shadow-[0_0_40px_rgba(0,229,160,0.3)] disabled:opacity-50 relative group overflow-hidden"
            >
              <span className="relative z-10">{authLoading ? "PROCESANDO..." : (authMode === "LOGIN" ? "INGRESAR A TERMINAL" : "REGISTRAR TÉCNICO")}</span>
              <div className="bg-[#00e5a0] p-1.5 rounded-lg text-[#061511]">
                <Monitor size={16} strokeWidth={3} />
              </div>
            </button>
          </form>

          <div className="mt-8 text-[9px] font-bold text-[#608096] tracking-widest uppercase">
            {authMode === "LOGIN" ? (
              <>
                ¿No tienes cuenta? <button type="button" onClick={() => setAuthMode("REGISTER")} className="text-[#00e5a0] hover:underline ml-1">Regístrate aquí</button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta? <button type="button" onClick={() => setAuthMode("LOGIN")} className="text-[#00e5a0] hover:underline ml-1">Ingresa aquí</button>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[7px] font-black text-[#3a5c72] uppercase tracking-[0.3em]">
            © 2026 ADVANCED SECURITY - SIMOC
          </p>
        </div>
      </div>
    </div>
  );
}
