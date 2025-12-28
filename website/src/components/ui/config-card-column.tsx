import * as React from "react";
import { cn } from "@/lib/utils";

interface ConfigCardColumnProps {
  children: React.ReactNode;
  gap?: 'none' | 'xs' | 'sm' | 'md'; // Maps to gap-0, gap-0.5, gap-1, gap-2
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-0.5',
  sm: 'gap-1',
  md: 'gap-2',
};

export function ConfigCardColumn({ 
  children, 
  gap = 'xs',
  className 
}: ConfigCardColumnProps) {
  return (
    <div className={cn("flex flex-col", gapClasses[gap], className)}>
      {children}
    </div>
  );
}
