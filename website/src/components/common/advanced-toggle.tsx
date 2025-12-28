import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdvancedToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function AdvancedToggle({ 
  open, 
  onOpenChange,
  className 
}: AdvancedToggleProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => onOpenChange(!open)}
      className={cn(
        "h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1",
        className
      )}
    >
      <span className="font-medium">Advanced</span>
      <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
    </Button>
  );
}
