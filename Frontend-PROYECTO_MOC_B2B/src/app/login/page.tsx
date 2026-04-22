"use client";

import React, { useState } from "react";
import { Zap, User, Lock, Monitor, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * Página de Login (Administración)
 * 
 * Interfaz de autenticación exclusiva para el personal administrativo y soporte.
 * Captura las credenciales (User/Pass) y las valida contra el endpoint JWT de Django.
 * Si el acceso es correcto, almacena los tokens en Cookies y redirige al Dashboard Admin.
 * 
 * @returns {JSX.Element} Pantalla de login estilo terminal/HUD.
 */
export default function LoginPage() {
    const [credentials, setCredentials] = useState({ user: '', pass: '' });
    const [loginError, setLoginError] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    /**
     * Handler de autenticación.
     * Realiza un fetch al microservicio de tokens `/api/token/`.
     * @param {React.FormEvent} e - Evento de formulario.
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLoginError(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/token/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: credentials.user,
                    password: credentials.pass
                })
            });

            if (res.ok) {
                const data = await res.json();
                Cookies.set("accessToken", data.access, { expires: 1 });
                Cookies.set("refreshToken", data.refresh, { expires: 7 });
                Cookies.set("adminUser", credentials.user, { expires: 1 });
                
                toast.success("ACCESO AUTORIZADO");
                router.push("/4_administrador");
            } else {
                setLoginError(true);
                toast.error("CREDENCIALES INVÁLIDAS");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("ERROR DE CONEXIÓN CON EL SERVIDOR");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020810] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-600/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-700">
                <div className="glass-panel p-10 md:p-12 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-8 group relative overflow-hidden">
                    {/* Top Glow Decor */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000" />

                    <div className="text-center space-y-4 relative">
                        <div className="w-16 h-16 bg-[#0a111a] border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 relative group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-20" />
                            <Zap size={28} className="text-emerald-400 fill-emerald-400/20" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase flex flex-col">
                                <span>BIENVENIDO</span>
                                <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">ADMINISTRADOR</span>
                            </h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] pt-1">Simoc System Terminal</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">CÉDULA DE IDENTIDAD</label>
                            <div className="relative group/input">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                <input
                                    type="text"
                                    value={credentials.user}
                                    onChange={(e) => {
                                        setCredentials(prev => ({ ...prev, user: e.target.value }));
                                        if (loginError) setLoginError(false);
                                    }}
                                    className={cn(
                                        "w-full pl-14 pr-6 py-4 bg-slate-100/5 border rounded-2xl text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-700",
                                        loginError ? "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.05)]" : "border-white/5 focus:border-emerald-500/40"
                                    )}
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">CONTRASEÑA DE ACCESO</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-emerald-400 transition-colors" />
                                <input
                                    type="password"
                                    value={credentials.pass}
                                    onChange={(e) => {
                                        setCredentials(prev => ({ ...prev, pass: e.target.value }));
                                        if (loginError) setLoginError(false);
                                    }}
                                    className={cn(
                                        "w-full pl-14 pr-6 py-4 bg-slate-100/5 border rounded-2xl text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-700",
                                        loginError ? "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.05)]" : "border-white/5 focus:border-emerald-500/40"
                                    )}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-shake">
                                <AlertTriangle size={14} className="text-rose-500" />
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight">Credenciales Inválidas</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#0a111a] hover:bg-black text-white rounded-xl border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-lg active:scale-[0.98] group/btn overflow-hidden relative disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                                {loading ? "PROCESANDO..." : "INGRESAR A TERMINAL"} 
                                <Monitor size={16} className="text-emerald-400" />
                            </span>
                        </button>
                    </form>

                </div>
            </div>

            <div className="mt-12 text-center opacity-30">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.5em]">© 2026 ADVANCED SECURITY - SIMOC</p>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
                
                body {
                    font-family: 'Inter', sans-serif;
                }

                .glass-panel {
                    background: rgb(4 7 11 / 80%);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
}
