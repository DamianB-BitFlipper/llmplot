import * as React from "react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConfigTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxRows?: number;
  error?: string;
}

export function ConfigTextarea({ 
  maxRows = 3,
  error,
  value,
  onChange,
  className,
  ...props 
}: ConfigTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEmpty = value === '' || value === undefined || value === null;
  
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * maxRows;
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    adjustHeight();
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      rows={1}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto",
        isEmpty && "border-dashed",
        error && "border-destructive bg-destructive/5",
        className
      )}
      style={{ minHeight: '32px', maxHeight: `${20 * maxRows}px` }}
      {...props}
    />
  );
}
