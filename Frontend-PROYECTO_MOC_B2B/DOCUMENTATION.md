# Documentación del Proyecto: MOC B2B Support System

Este documento proporciona una visión general y detalles técnicos de los componentes del frontend del proyecto "PROYECTO SOPORTE".

## 1. Visión General
El sistema es una aplicación web construida con **Next.js 14+ (App Router)** diseñada para gestionar el flujo de soporte técnico. Conecta a técnicos en campo con una mesa de ayuda (Soporte) para la gestión, resolución y escalamiento de incidentes.

### Módulos Principales
1.  **Técnicos (Field Service)**: Interfaz para el reporte de gestiones desde sitio.
2.  **Soporte (Dispatch/Helpdesk)**: Consola de monitoreo y gestión de casos.
3.  **Despacho**: (Estructura similar a soporte/administración).
4.  **Administrador**: (Gestión de configuración y usuarios).

## 2. Arquitectura Técnica
-   **Frontend Framework**: Next.js (React) con TypeScript.
-   **Estilos**: Tailwind CSS con módulos de utilidad y diseño "Glassmorphism" (efectos de vidrio/neon).
-   **Estado**: Gestión de estado local con React Hooks (`useState`, `useEffect`, `useRef`).
-   **Iconografía**: `lucide-react`.
-   **Comunicación Backend**: Fetch API contra un backend Django (`http://127.0.0.1:8000/api/`).
-   **Sincronización**: Polling (intervalos) para actualizaciones casi en tiempo real en la consola de soporte.

## 3. Estructura de Directorios
```
src/app/
├── 1_tecnicos/       # Módulo para Técnicos (Formulario)
├── 2_soporte/        # Módulo para Mesa de Soporte (Dashboard)
├── 3_despacho/       # Módulo de Despacho
├── 4_administrador/  # Módulo Administrativo
├── components/       # Componentes Reutilizables Compartidos
└── globals.css       # Estilos globales y variables de tema
```

---

## 4. Componentes Compartidos (`src/app/components/`)

### `PlantillaRender.tsx`
Este es el componente núcleo para la generación de formularios dinámicos. Permite renderizar diferentes campos según la tecnología o tipo de gestión sin duplicar código.

*   **Propósito**: Renderizar inputs y textareas basados en una configuración JSON.
*   **Props Principales**:
    *   `titulo`: Títular de la sección.
    *   `campos`: Array de objetos que definen los inputs.
    *   `formExtra`: Objeto de estado donde se guardan los datos.
    *   `setFormExtra`: Función para actualizar el estado.
*   **Características**:
    *   Completado automático de fecha actual.
    *   Lógica condicional para campos de solo lectura (ej: Fecha).
    *   Concatenación automática de campos clave (ej: Incidente + Técnico).

### `plantillas.tsx`
Archivo de configuración que contiene las definiciones constantes de los formularios. No es un componente React, sino una librería de configuraciones.

*   **Contenido**: Arrays de objetos `{ label: string, type: string }`.
*   **Variantes**:
    *   `plantillaCierreGPON/HFC/FIBRA`: Para cierres de casos.
    *   `plantillaEnrutarGPON/HFC/FIBRA`: Para escalamiento de casos.

---

## 5. Documentación de Módulos (Páginas)

### Módulo de Técnicos (`src/app/1_tecnicos/page.tsx`)
**Tipo**: Formulario Wizard / Registro de Datos.

**Funcionalidad**:
*   Permite a los técnicos registrar sus actividades (Cierre, Enrutamiento, Soporte, Asesoría).
*   **Selección de Contexto**: Pestañas para "Reparaciones" o "Instalaciones".
*   **Formulario Dinámico**:
    *   Usa `PlantillaLogic` (subcomponente interno) para elegir qué `PlantillaRender` mostrar basado en la selección de `Tecnología` (GPON/HFC/FIBRA) y `Gestión` (Cierre/Enrutar).
*   **Validación**: Verifica campos requeridos antes del envío (ej: Sub-asesoría).
*   **Integración**: Obtiene la lista de funcionarios (`/api/funcionarios/`) y envía reportes (`/api/soporte/`).

### Módulo de Soporte (`src/app/2_soporte/page.tsx`)
**Tipo**: Dashboard de Operaciones / Consola en Tiempo Real.

**Funcionalidad**:
*   **Monitoreo en Tiempo Real**: Usa `setInterval` (Polling) cada 2 segundos para refrescar datos.
*   **Gestión de Estado de Asesores**:
    *   Panel lateral que muestra disponibilidad de agentes.
    *   Persistencia de estado (En Gestión, Descanso, etc.) usando `localStorage` y API.
*   **Tabla de Gestiones**:
    *   Listado de casos con indicadores visuales (Prioridad, En Sitio).
    *   Capacidad de editar campos clave (Login N1, Estado, Observaciones) directamente.
*   **Modales Interactivos**:
    *   Visualización de plantillas JSON en formato legible.
    *   Lectura y respuesta a novedades de despacho.
*   **Sistema de Alertas**:
    *   Notificaciones visuales animadas para casos prioritarios.

### Módulo de Despacho (`src/app/3_despacho/page.tsx`)
**Tipo**: Terminal de Despacho / Mesa de Control.

**Funcionalidad**:
*   Variante del módulo de Soporte enfocada en la **asignación y priorización**.
*   **Branding Diferenciado**: Esquema de colores Ámbar/Naranja.
*   **Gestión de Novedades**:
    *   Foco principal en el campo `observaciones_ultima` para comunicar instrucciones desde Despacho a Soporte.
    *   Visualización de cuales novedades han sido leídas por Soporte (Indicador "VISTO").
*   **Restricciones**: Puede ver la mayoría de datos pero tiene permisos de edición limitados comparado con Soporte.

### Módulo de Administrador (`src/app/4_administrador/page.tsx`)
**Tipo**: Dashboard de Gestión / Backoffice.

**Funcionalidad**:
*   **Sistema de Pestañas**:
    1.  **Dashboard**: Estadísticas globales, gráficos de rendimiento y monitoreo en vivo de asesores.
    2.  **Asesores**: CRUD completo (Crear, Leer, Actualizar, Eliminar) de cuentas de asesores de soporte.
    3.  **Funcionarios**: CRUD de la base de datos de técnicos en campo.
    4.  **Soportes**: Historial completo de incidentes con opciones de eliminación/auditoría.
*   **Reportes**: Capacidad de exportar datos a **Excel (.xlsx)**, **PDF** y **CSV** usando librerías como `xlsx` y `jspdf`.
*   **Visualización de Datos**: Gráficos de barras simples y tarjetas de KPI.
*   **Estilos Globales**: Inyección de estilos CSS globales para scrollbars personalizados y efectos de vidrio.

---

## 6. Integración Backend (API)
El frontend consume una API REST en `http://127.0.0.1:8000/api/`.

### Endpoints Principales
*   `GET/POST /api/soporte/`: Gestión de incidentes (Tickets).
*   `GET/POST/PATCH/DELETE /api/asesores/`: Gestión de usuarios de mesa de ayuda.
*   `GET/POST/PATCH/DELETE /api/funcionarios/`: Gestión de técnicos.

## 7. Modelos de Datos (Inferidos)

### Soporte / Ticket (`/api/soporte/`)
```typescript
interface Ticket {
  id: number;
  fecha_hora: string;  // ISO Date
  incidente: string;
  nombre: string;      // Nombre técnico
  celular: string;
  torre: string;
  tecnologia: "GPON" | "HFC" | "FIBRA";
  gestion: "CIERRE" | "ENRUTAR" | "SOPORTE" | "ASESORIA";
  estado: "En gestión" | "Enrutado" | "Resuelto" | "Mal Escalado";
  login_n1: string;    // Login del asesor asignado
  plantilla: string;   // JSON stringified con datos dinámicos
  observaciones: string;
  observaciones_ultima: string; // Canal de chat despacho-soporte
  en_sitio: boolean;
  es_prioridad: boolean;
}
```

### Funcionario (`/api/funcionarios/`)
```typescript
interface Funcionario {
  id: number;
  nombre_funcionario: string;
  cedula: string;
  celular: string;
}
```

### Asesor (`/api/asesores/`)
```typescript
interface Asesor {
  id: number;
  nombre_asesor: string;
  login: string;
  cedula: string;
  perfil: "EN_CIERRES" | "SOLO_SOPORTES" | "TODO";
  estado: "EN_GESTION" | "EN_DESCANSO" | "NO_DISPONIBLE" | "CASO_COMPLEJO";
}
```

## 8. Sistema de Diseño (`globals.css`)
El proyecto utiliza un sistema de diseño personalizado basado en variables CSS y clases de utilidad.

### Paleta de Colores
*   **Tema Oscuro (Default)**: Fondo `#020617` (Deep Blue) con acentos `#10b981` (Emerald).
*   **Tema Claro**: Fondo `#f8fafc` (Slate 50) con acentos `#059669` (Emerald Dark).
*   **Implementación**: Variables CSS nativas (`--background`, `--primary`) dentro de bloques `:root` y `.light`.

### Efectos Visuales Clave
1.  **Glassmorphism (`.glass-panel`)**:
    *   Uso de `backdrop-filter: blur(12px)` para crear superposiciones traslúcidas.
    *   Bordes semitransparentes (`rgba(255, 255, 255, 0.05)`) para definición sutil.
2.  **Cyber Grid (`.cyber-grid`)**:
    *   Fondo estructural creado con `linear-gradient` repetitivo para simular una malla técnica de fondo.
3.  **Micro-Interacciones**:
    *   `animate-pulse-slow`: Pulsación suave para luces ambientales de fondo.
    *   `animate-bounce-subtle`: Indicador de atención para botones de novedades.
    *   `animate-priority`: Efecto de onda (ripple) para casos urgentes.

---

## 9. Notas de Despliegue
*   **Entorno**: Node.js 18+
*   **Dependencias Clave**: `next`, `react`, `lucide-react`, `xlsx`, `jspdf`.
*   **Comandos de Desarrollo**:
    *   `npm run dev`: Inicia servidor en puerto 3000.
    *   `npm run build`: Genera versión optimizada para producción.

