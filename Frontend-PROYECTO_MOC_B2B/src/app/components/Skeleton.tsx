import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton = ({ className, count = 1 }: SkeletonProps) => {
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

export default Skeleton;
