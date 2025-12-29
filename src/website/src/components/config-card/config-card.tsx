import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfigCardProps {
  children: React.ReactNode | ((isActive: boolean) => React.ReactNode);
  onRemove?: () => void;
  canRemove?: boolean;
  className?: string;
}

export function ConfigCard({ 
  children, 
  onRemove, 
  canRemove = true,
  className 
}: ConfigCardProps) {
  const [isActive, setIsActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFocusCapture = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleBlurCapture = useCallback((e: React.FocusEvent) => {
    // Check if focus is moving to an element outside the card
    const relatedTarget = e.relatedTarget as Node | null;
    if (cardRef.current && !cardRef.current.contains(relatedTarget)) {
      setIsActive(false);
    }
  }, []);

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "relative group border shadow-sm bg-card transition-all hover:shadow-md",
        className
      )}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <CardContent className="pt-2 pb-2 px-3">
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove}
            className={cn(
              "absolute top-1.5 right-3 h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
              !canRemove && "opacity-0 pointer-events-none"
            )}
            title="Remove"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {typeof children === "function" ? children(isActive) : children}
      </CardContent>
    </Card>
  );
}
