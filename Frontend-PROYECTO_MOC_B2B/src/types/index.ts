export interface SoporteEvidenciaFile {
  archivo: string;
}

export interface Soporte {
  id: number;
  fecha_hora: string;
  en_sitio: boolean;
  nombre: string;
  celular: string | null;
  torre: string;
  incidente: string;
  gestion: string;
  observaciones: string;
  plantilla: string;
  login_n1: string;
  tipo_servicio: string;
  estado: string;
  observaciones_ultima: string;
  prioridad: boolean;
  fecha_inicio_sitio: string | null;
  fecha_fin: string | null;
  chat_visto_soporte: boolean;
  chat_visto_tecnico: boolean;
  chat_visto_despacho: boolean;
  evidencias?: string | null;
  evidencias_files?: SoporteEvidenciaFile[];
}

export interface AsesorSoporte {
  id: number;
  nombre_asesor: string;
  cedula: string;
  login: string;
  perfil: string;
  estado: string;
  ultimo_cambio_estado: string;
}

export interface Noticia {
  id: number;
  contenido: string;
  fecha_publicacion: string;
  activa: boolean;
}

export interface Funcionario {
  id: number;
  nombre_funcionario: string;
  cedula: string;
  celular: string | null;
  password?: string | null;
}

export interface HistorialEstadoAsesor {
  id: number;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  duracion_segundos: number | null;
}
export interface AuditLog {
  id: number;
  model_name: string;
  object_id: string;
  action: string;
  admin_user: string;
  changes: string;
  timestamp: string;
}
