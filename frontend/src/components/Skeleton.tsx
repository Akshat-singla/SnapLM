import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className}`}
      {...props}
    />
  );
}

export function ProjectSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-surface-dark/40 border border-surface-border animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="flex justify-between items-center mt-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function NodeSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-surface-dark/10 border border-surface-border/50 animate-pulse w-48">
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <div className="flex justify-between mt-4">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <Skeleton className="h-3 w-20 self-start" />
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
    </div>
  );
}
