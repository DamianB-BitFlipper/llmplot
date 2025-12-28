import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConfigLabelProps {
  children: React.ReactNode;
  size?: 'normal' | 'small';
  htmlFor?: string;
  className?: string;
}

export function ConfigLabel({ 
  children, 
  size = 'normal',
  htmlFor,
  className 
}: ConfigLabelProps) {
  return (
    <Label 
      htmlFor={htmlFor}
      className={cn(
        size === 'normal' 
          ? "text-xs text-muted-foreground font-medium"
          : "text-[9px] text-muted-foreground uppercase font-semibold",
        className
      )}
    >
      {children}
    </Label>
  );
}
