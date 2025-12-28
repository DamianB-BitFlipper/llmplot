import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ConfigInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  suffix?: string;
  size?: 'normal' | 'small';
}

export function ConfigInput({ 
  error,
  suffix,
  size = 'normal',
  value,
  className,
  ...props 
}: ConfigInputProps) {
  const isEmpty = value === '' || value === undefined || value === null;
  
  const input = (
    <Input
      value={value}
      className={cn(
        size === 'normal' ? "h-8 text-sm" : "h-7 text-xs bg-background",
        isEmpty && "border-dashed",
        error && "border-destructive bg-destructive/5",
        suffix && (size === 'normal' ? "pr-6" : "pr-5"),
        className
      )}
      {...props}
    />
  );

  if (suffix) {
    return (
      <div className="relative">
        {input}
        <span className={cn(
          "absolute right-2 top-0 h-full flex items-center text-muted-foreground pointer-events-none",
          size === 'normal' ? "text-sm" : "text-[9px]"
        )}>
          {suffix}
        </span>
      </div>
    );
  }

  return input;
}
