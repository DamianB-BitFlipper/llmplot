import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { ModelConfig, ModelValidationErrors, CustomProvider } from "./types.js";
import { ProviderSelect } from "./ProviderSelect.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  canRemove: boolean;
  customProviders: CustomProvider[];
  onUpdate: (updates: Partial<ModelConfig>) => void;
  onRemove: () => void;
  onAddCustomProvider: () => void;
}

export function ModelCard({ model, index, errors, canRemove, customProviders, onUpdate, onRemove, onAddCustomProvider }: ModelCardProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Model {index + 1}</span>
          {canRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Provider</Label>
            <ProviderSelect
              value={model.provider}
              onChange={(value) => onUpdate({ provider: value })}
              customProviders={customProviders}
              onAddCustomClick={onAddCustomProvider}
              error={errors.provider}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Model Name</Label>
            <Input
              type="text"
              value={model.modelName}
              onChange={(e) => onUpdate({ modelName: e.target.value })}
              className={cn(errors.modelName && "border-destructive bg-destructive/10")}
              placeholder="e.g., gpt-4o"
            />
            {errors.modelName && <p className="text-xs text-destructive">{errors.modelName}</p>}
          </div>
        </div>

        {/* Score Mode */}
        <div className="space-y-2">
          <RadioGroup
            value={model.scoreMode}
            onValueChange={(value) => onUpdate({ scoreMode: value as 'fraction' | 'percent' })}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fraction" id={`fraction-${index}`} />
              <Label htmlFor={`fraction-${index}`} className="text-sm cursor-pointer">Fraction</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percent" id={`percent-${index}`} />
              <Label htmlFor={`percent-${index}`} className="text-sm cursor-pointer">Percent</Label>
            </div>
          </RadioGroup>

          {model.scoreMode === 'fraction' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Positive</Label>
                <Input
                  type="number"
                  value={model.positive}
                  onChange={(e) => onUpdate({ positive: e.target.value })}
                  className={cn(errors.positive && "border-destructive bg-destructive/10")}
                  placeholder="e.g., 92"
                  min="0"
                />
                {errors.positive && <p className="text-xs text-destructive">{errors.positive}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total</Label>
                <Input
                  type="number"
                  value={model.total}
                  onChange={(e) => onUpdate({ total: e.target.value })}
                  className={cn(errors.total && "border-destructive bg-destructive/10")}
                  placeholder="e.g., 100"
                  min="1"
                />
                {errors.total && <p className="text-xs text-destructive">{errors.total}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Percent</Label>
              <Input
                type="number"
                value={model.percent}
                onChange={(e) => onUpdate({ percent: e.target.value })}
                className={cn(errors.percent && "border-destructive bg-destructive/10")}
                placeholder="e.g., 92"
                min="0"
                max="100"
                step="0.1"
              />
              {errors.percent && <p className="text-xs text-destructive">{errors.percent}</p>}
            </div>
          )}
        </div>

        {/* Advanced Section */}
        <Collapsible open={model.showAdvanced} onOpenChange={(open) => onUpdate({ showAdvanced: open })}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-foreground">
              {model.showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
              Advanced
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-3 pl-5 border-l-2 border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                type="text"
                value={model.displayName}
                onChange={(e) => onUpdate({ displayName: e.target.value })}
                placeholder="Override display label"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Total Params (B)</Label>
                <Input
                  type="number"
                  value={model.totalParams}
                  onChange={(e) => onUpdate({ totalParams: e.target.value })}
                  className={cn(errors.totalParams && "border-destructive bg-destructive/10")}
                  placeholder="e.g., 175"
                  min="1"
                />
                {errors.totalParams && <p className="text-xs text-destructive">{errors.totalParams}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Active Params (B)</Label>
                <Input
                  type="number"
                  value={model.activeParams}
                  onChange={(e) => onUpdate({ activeParams: e.target.value })}
                  className={cn(errors.activeParams && "border-destructive bg-destructive/10")}
                  placeholder="e.g., 32"
                  min="1"
                />
                {errors.activeParams && <p className="text-xs text-destructive">{errors.activeParams}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Color Override</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={model.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className={cn("flex-1", errors.color && "border-destructive bg-destructive/10")}
                  placeholder="#FF5733"
                />
                <input
                  type="color"
                  value={model.color || "#000000"}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="w-10 h-10 p-1 border border-input rounded-md cursor-pointer"
                />
              </div>
              {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
