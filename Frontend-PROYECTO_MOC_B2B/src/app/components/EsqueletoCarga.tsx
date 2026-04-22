import React from 'react';

/**
 * Propiedades para esqueletos de carga.
 * @interface SkeletonProps
 */
interface SkeletonProps {
  /** Estilos manuales o clases de Tailwind para definir altura/ancho. */
  className?: string;
  /** Cantidad de bloques de carga a renderizar de forma secuencial. */
  count?: number;
}

/**
 * Componente EsqueletoCarga
 * 
 * IU de carga animada (Skeleton loading) que utiliza el efecto `animate-pulse` de Tailwind.
 * Se utiliza para evitar layouts parpadeantes mientras se esperan respuestas de la API.
 * 
 * @param {SkeletonProps} props
 */
const EsqueletoCarga = ({ className, count = 1 }: SkeletonProps) => {
    return (
        <div className="space-y-2 w-full animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`bg-slate-800/50 rounded-lg ${className}`}
                />
            ))}
        </div>
    );
};

export default EsqueletoCarga;
