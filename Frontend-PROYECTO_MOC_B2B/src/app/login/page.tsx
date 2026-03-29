"use client";

import React, { useState } from "react";
import { ShieldCheck, Search, Activity, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ user: '', pass: '' });
    const [loginError, setLoginError] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                // Store token in cookie for middleware and API calls
                Cookies.set("accessToken", data.access, { expires: 1 }); // 1 day
                Cookies.set("refreshToken", data.refresh, { expires: 7 }); // 7 days
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
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-600 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-emerald-600 blur-[180px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="glass-panel p-10 md:p-14 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-10 group overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />

                    <div className="text-center space-y-3 relative">
                        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/20 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck size={38} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                            ACCESO <span className="text-blue-500">ADMIN</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Administrator Terminal V1.0</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6 relative">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">USUARIO AUTORIZADO</label>
                            <div className="relative group/input">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={credentials.user}
                                    onChange={(e) => {
                                        setCredentials(prev => ({ ...prev, user: e.target.value }));
                                        if (loginError) setLoginError(false);
                                    }}
                                    className={cn(
                                        "w-full pl-16 pr-6 py-5 bg-slate-950/50 border rounded-3xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-800",
                                        loginError ? "border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/5 focus:border-blue-500/50"
                                    )}
                                    placeholder="USUARIO"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">CONTRASEÑA DE ACCESO</label>
                            <div className="relative group/input">
                                <Activity className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="password"
                                    value={credentials.pass}
                                    onChange={(e) => {
                                        setCredentials(prev => ({ ...prev, pass: e.target.value }));
                                        if (loginError) setLoginError(false);
                                    }}
                                    className={cn(
                                        "w-full pl-16 pr-6 py-5 bg-slate-950/50 border rounded-3xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-800",
                                        loginError ? "border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/5 focus:border-blue-500/50"
                                    )}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4 animate-shake shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                                <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center shrink-0">
                                    <AlertTriangle size={18} className="text-rose-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Acceso Denegado</span>
                                    <span className="text-[8px] font-bold text-rose-400/60 uppercase tracking-widest">Error de Autenticación</span>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 group/btn overflow-hidden relative disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? "AUTENTICANDO..." : "INGRESAR.."} <ChevronRight size={16} />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                        </button>
                    </form>

                    <div className="pt-4 text-center">
                        <button className="text-[9px] font-black text-slate-600 hover:text-blue-500 transition-colors tracking-widest uppercase">Forgotten Credentials? Contact SysAdmin</button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .glass-panel {
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer { animation: shimmer 2s infinite; }
            `}</style>
        </div>
    );
}
