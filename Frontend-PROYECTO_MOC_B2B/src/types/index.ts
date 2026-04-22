/**
 * Representa un archivo de evidencia adjunto a un soporte.
 * @interface SoporteEvidenciaFile
 */
export interface SoporteEvidenciaFile {
  /** Ruta o URL relativa del archivo en el servidor. */
  archivo: string;
}

/**
 * Interfaz principal de un Ticket de Soporte.
 * Contiene toda la información técnica, de contacto y estados de chat.
 * @interface Soporte
 */
export interface Soporte {
  /** ID único del registro en base de datos. */
  id: number;
  /** Fecha y hora de creación de la gestión. */
  fecha_hora: string;
  /** Indica si el técnico se encuentra físicamente en el sitio. */
  en_sitio: boolean;
  /** Nombre del técnico o funcionario responsable. */
  nombre: string;
  /** Número de contacto del técnico. */
  celular: string | null;
  /** Identificación de la torre o ubicación del cliente. */
  torre: string;
  /** Código o número de incidente (Ticket). */
  incidente: string;
  /** Tipo de gestión (Cierre, Enrutar, Asesoría, etc.). */
  gestion: string;
  /** Comentarios adicionales iniciales. */
  observaciones: string;
  /** JSON stringificado con los campos de la plantilla técnica aplicada. */
  plantilla: string;
  /** Login del asesor de Nivel 1 asignado. */
  login_n1: string;
  /** Tecnología del servicio (GPON, HFC, FIBRA). */
  tipo_servicio: string;
  /** Estado actual de la gestión (Pendiente, Proceso, Finalizado). */
  estado: string;
  /** Última observación o actualización del estado. */
  observaciones_ultima: string;
  /** Indica si el caso tiene prioridad alta. */
  prioridad: boolean;
  /** Timestamp de inicio de labores en sitio. */
  fecha_inicio_sitio: string | null;
  /** Timestamp de finalización de la gestión. */
  fecha_fin: string | null;
  /** Flag de notificación para el rol Soporte. */
  chat_visto_soporte: boolean;
  /** Flag de notificación para el rol Técnico. */
  chat_visto_tecnico: boolean;
  /** Flag de notificación para el rol Despacho. */
  chat_visto_despacho: boolean;
  /** String con rutas de evidencias (deprecado o legacy). */
  evidencias?: string | null;
  /** Array de archivos de evidencia asociados. */
  evidencias_files?: SoporteEvidenciaFile[];
}

/**
 * Datos de un Asesor de Soporte / Nivel 1.
 * @interface AsesorSoporte
 */
export interface AsesorSoporte {
  /** ID único del asesor. */
  id: number;
  /** Nombre completo del personal. */
  nombre_asesor: string;
  /** Documento de identidad. */
  cedula: string;
  /** Nombre de usuario para login. */
  login: string;
  /** Perfil o rol (Soporte N1). */
  perfil: string;
  /** Estado laboral actual (Disponible, Ocupado, etc.). */
  estado: string;
  /** Última vez que cambió de estado. */
  ultimo_cambio_estado: string;
}

/**
 * Estructura de una Noticia o Comunicado.
 * @interface Noticia
 */
export interface Noticia {
  /** ID de la noticia. */
  id: number;
  /** Texto del comunicado. */
  contenido: string;
  /** Fecha de creación. */
  fecha_publicacion: string;
  /** Define si la noticia es visible en el banner. */
  activa: boolean;
}

export interface Funcionario {
  id: number;
  nombre_funcionario: string;
  cedula: string;
  celular: string | null;
  password?: string | null;
}

/**
 * Registro de un cambio de estado de un asesor.
 * @interface HistorialEstadoAsesor
 */
export interface HistorialEstadoAsesor {
  id: number;
  /** Nombre del estado al que cambió. */
  estado: string;
  /** Inicio del periodo en ese estado. */
  fecha_inicio: string;
  /** Fin del periodo (null si sigue en él). */
  fecha_fin: string | null;
  /** Tiempo total acumulado en ese estado. */
  duracion_segundos: number | null;
}
/**
 * Registro de Auditoría para acciones administrativas.
 * @interface AuditLog
 */
export interface AuditLog {
  id: number;
  /** Modelo afectado (Soporte, Asesor, etc.). */
  model_name: string;
  /** ID del objeto afectado. */
  object_id: string;
  /** Acción realizada (Create, Update, Delete). */
  action: string;
  /** Usuario que realizó la acción. */
  admin_user: string;
  /** JSON string con el diff de cambios. */
  changes: string;
  /** Fecha y hora del log. */
  timestamp: string;
}
