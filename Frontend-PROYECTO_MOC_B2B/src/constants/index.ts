export const PERFILES_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    "EN_CIERRES": { label: "Cierres", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    "SOLO_SOPORTES": { label: "Soporte", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    "TODO": { label: "Todo gestión", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" }
};

export const ESTADOS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    "EN_GESTION": { label: "En gestión", color: "text-emerald-500", dot: "bg-emerald-500 shadow-emerald-500/50" },
    "EN_DESCANSO": { label: "En descanso", color: "text-rose-500", dot: "bg-rose-500 shadow-rose-500/50" },
    "NO_DISPONIBLE": { label: "No disponible", color: "text-slate-500", dot: "bg-slate-500 shadow-slate-500/10" },
    "CASO_COMPLEJO": { label: "Caso complejo", color: "text-amber-500", dot: "bg-amber-500 shadow-amber-500/50" }
};
