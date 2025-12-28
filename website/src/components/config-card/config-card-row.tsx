import * as React from "react";
import { cn } from "@/lib/utils";

interface ConfigCardRowProps {
  children: React.ReactNode;
  columns?: string; // CSS grid-template-columns, e.g. "140px 1fr"
  className?: string;
}

export function ConfigCardRow({ 
  children, 
  columns = "1fr",
  className 
}: ConfigCardRowProps) {
  return (
    <div 
      className={cn("grid gap-x-3 gap-y-2", className)}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}
