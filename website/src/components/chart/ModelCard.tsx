import { ChevronRight, X } from "lucide-react";
import type { ModelConfig, ModelValidationErrors, CustomProvider } from "./types.js";
import { ProviderSelect } from "./ProviderSelect.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ModelCardProps {
  model: ModelConfig;
  index: number;
  errors: ModelValidationErrors;
  touched: Record<string, boolean>;
  showAllErrors: boolean;
  canRemove: boolean;
  customProviders: CustomProvider[];
  onUpdate: (updates: Partial<ModelConfig>) => void;
  onRemove: () => void;
  onAddCustomProvider: () => void;
  onMarkTouched: (field: string) => void;
}

export function ModelCard({ 
  model, 
  index: _index, 
  errors, 
  touched,
  showAllErrors,
  canRemove, 
  customProviders, 
  onUpdate, 
  onRemove, 
  onAddCustomProvider,
  onMarkTouched
}: ModelCardProps) {
  const showError = (field: keyof ModelValidationErrors): string | undefined => {
    if (showAllErrors || touched[field]) {
      return errors[field];
    }
    return undefined;
  };

  return (
    <Card className="relative group border shadow-sm bg-card transition-all hover:shadow-md">
      <CardContent className="pt-2 pb-3 px-3">
        {/* X button - absolute top right, aligned with content */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className={cn(
            "absolute top-1.5 right-3 h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all", 
            !canRemove && "opacity-0 pointer-events-none"
          )}
          title="Remove Model"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Two-column grid with aligned rows */}
        <div className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2">
          {/* Row 1: Labels */}
          <Label className="text-xs text-muted-foreground font-medium">Provider</Label>
          <Label className="text-xs text-muted-foreground font-medium">Model Name</Label>
          
          {/* Row 2: Provider dropdown & Model Name input */}
          <ProviderSelect
            value={model.provider}
            onChange={(value) => {
              onUpdate({ provider: value });
              onMarkTouched('provider');
            }}
            customProviders={customProviders}
            onAddCustomClick={onAddCustomProvider}
            error={showError('provider')}
            className="h-8 text-sm"
          />
          <div className="relative">
            <Input
              type="text"
              value={model.modelName}
              onChange={(e) => onUpdate({ modelName: e.target.value })}
              onBlur={() => onMarkTouched('modelName')}
              className={cn(
                "h-8 text-sm transition-colors", 
                !model.modelName && "border-dashed",
                showError('modelName') && "border-destructive focus-visible:ring-destructive bg-destructive/5"
              )}
              placeholder="e.g. GPT-4o"
            />
            {showError('modelName') && (
              <div className="absolute right-2 top-2.5 h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" title={errors.modelName} />
            )}
          </div>

          {/* Row 3: Labels */}
          <Label className="text-xs text-muted-foreground font-medium">Format</Label>
          <div className="flex items-center">
            {model.scoreMode === 'fraction' ? (
              <>
                <Label className="text-xs text-muted-foreground font-medium w-20">Passed</Label>
                <span className="w-3" />
                <Label className="text-xs text-muted-foreground font-medium w-20">Total</Label>
              </>
            ) : (
              <Label className="text-xs text-muted-foreground font-medium">Percentage</Label>
            )}
          </div>

          {/* Row 4: Format toggle & Score inputs + Advanced */}
          <div className="flex bg-muted p-0.5 rounded-md h-8 border">
            <button
              type="button"
              onClick={() => onUpdate({ scoreMode: 'fraction' })}
              className={cn(
                "flex-1 text-xs font-medium rounded-sm transition-all flex items-center justify-center",
                model.scoreMode === 'fraction' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Fraction
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ scoreMode: 'percent' })}
              className={cn(
                "flex-1 text-xs font-medium rounded-sm transition-all flex items-center justify-center",
                model.scoreMode === 'percent' 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              %
            </button>
          </div>
          
          <div className="flex items-center">
            {model.scoreMode === 'fraction' ? (
              <>
                <Input
                  type="number"
                  value={model.passed}
                  onChange={(e) => onUpdate({ passed: e.target.value })}
                  onBlur={() => onMarkTouched('passed')}
                  className={cn(
                    "h-8 text-sm w-20", 
                    !model.passed && "border-dashed",
                    showError('passed') && "border-destructive bg-destructive/5"
                  )}
                  placeholder="75"
                  min="0"
                />
                <span className="text-muted-foreground font-light text-sm w-3 text-center">/</span>
                <Input
                  type="number"
                  value={model.total}
                  onChange={(e) => onUpdate({ total: e.target.value })}
                  onBlur={() => onMarkTouched('total')}
                  className={cn(
                    "h-8 text-sm w-20", 
                    !model.total && "border-dashed",
                    showError('total') && "border-destructive bg-destructive/5"
                  )}
                  placeholder="100"
                  min="1"
                />
              </>
            ) : (
              <div className="relative">
                <Input
                  type="number"
                  value={model.percent}
                  onChange={(e) => onUpdate({ percent: e.target.value })}
                  onBlur={() => onMarkTouched('percent')}
                  className={cn(
                    "h-8 text-sm w-20 pr-6", 
                    !model.percent && "border-dashed",
                    showError('percent') && "border-destructive bg-destructive/5"
                  )}
                  placeholder="74.2"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <span className="absolute right-2 top-0 h-full flex items-center text-muted-foreground text-sm pointer-events-none">
                  %
                </span>
              </div>
            )}

            {/* Advanced toggle */}
            <div className="flex-1 flex justify-end">
              <Collapsible 
                open={model.showAdvanced} 
                onOpenChange={(open) => onUpdate({ showAdvanced: open })}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <span className="font-medium">Advanced</span>
                    <ChevronRight className={cn("h-3 w-3 transition-transform", model.showAdvanced && "rotate-90")} />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>
        </div>

        {/* Advanced Content - full width below both columns */}
        <Collapsible 
          open={model.showAdvanced} 
          onOpenChange={(open) => onUpdate({ showAdvanced: open })}
        >
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-3 gap-3 bg-muted/20 p-2 rounded-md border border-dashed">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Total Params</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={model.totalParams}
                    onChange={(e) => onUpdate({ totalParams: e.target.value })}
                    className="h-7 text-xs pr-5 bg-background"
                    placeholder="-"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-muted-foreground">B</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Active Params</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={model.activeParams}
                    onChange={(e) => onUpdate({ activeParams: e.target.value })}
                    className="h-7 text-xs pr-5 bg-background"
                    placeholder="-"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-muted-foreground">B</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Color</Label>
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 shrink-0 overflow-hidden rounded-md border shadow-sm transition-transform active:scale-95 cursor-pointer">
                    <input
                      type="color"
                      value={model.color || "#000000"}
                      onChange={(e) => onUpdate({ color: e.target.value })}
                      className="absolute inset-[-50%] w-[200%] h-[200%] p-0 border-0 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={model.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="h-7 text-[10px] font-mono bg-background px-1"
                    placeholder="Auto"
                  />
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

      </CardContent>
    </Card>
  );
}
