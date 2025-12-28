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
          "bg-muted/20 p-2 rounded-md border border-dashed",
          className
        )}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
