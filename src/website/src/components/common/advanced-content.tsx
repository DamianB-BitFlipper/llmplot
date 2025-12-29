import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface AdvancedContentProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function AdvancedContent({ 
  open, 
  children,
  className 
}: AdvancedContentProps) {
  return (
    <Collapsible open={open}>
      <CollapsibleContent className="pt-2">
        <div className={cn(
          "bg-muted/20 p-2 rounded-md border",
          className
        )}>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Advanced Options
          </div>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
