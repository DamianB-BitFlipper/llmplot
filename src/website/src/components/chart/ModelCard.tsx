import type { ModelConfig, ModelValidationErrors, CustomProvider } from "./types.js";
import { ProviderSelect } from "./ProviderSelect.js";
import { Input } from "@/components/ui/input";
import { ConfigCard } from "@/components/config-card/config-card";
import { ConfigCardRow } from "@/components/config-card/config-card-row";
import { ConfigCardColumn } from "@/components/config-card/config-card-column";
import { ConfigLabel } from "@/components/config-card/config-label";
import { ConfigInput } from "@/components/config-card/config-input";
import { AdvancedToggle } from "@/components/common/advanced-toggle";
import { AdvancedContent } from "@/components/common/advanced-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ModelCardProps {
  model: ModelConfig;
  errors: ModelValidationErrors;
  touched: Record<string, boolean>;
  showAllErrors: boolean;
  canRemove: boolean;
  customProviders: CustomProvider[];
  onUpdate: (updates: Partial<ModelConfig>) => void;
  onRemove: () => void;
  onAddCustomProvider: () => void;
  onDeleteCustomProvider?: (key: string) => void;
  onMarkTouched: (field: string) => void;
}

export function ModelCard({ 
  model, 
  errors, 
  touched,
  showAllErrors,
  canRemove, 
  customProviders, 
  onUpdate, 
  onRemove, 
  onAddCustomProvider,
  onDeleteCustomProvider,
  onMarkTouched
}: ModelCardProps) {
  const showError = (field: keyof ModelValidationErrors): string | undefined => {
    if (showAllErrors || touched[field]) {
      return errors[field];
    }
    return undefined;
  };

  return (
    <ConfigCard onRemove={onRemove} canRemove={canRemove}>
      <div className="space-y-2">
        {/* Row 1: Provider, Model Name & Score */}
        <ConfigCardRow columns="140px 1fr 140px">
          <ConfigCardColumn>
            <ConfigLabel>Provider</ConfigLabel>
            <ProviderSelect
              value={model.provider}
              onChange={(value) => {
                onUpdate({ provider: value });
                onMarkTouched('provider');
              }}
              customProviders={customProviders}
              onAddCustomClick={onAddCustomProvider}
              onDeleteCustom={onDeleteCustomProvider}
              error={showError('provider')}
              className="h-8 text-sm"
            />
          </ConfigCardColumn>
          <ConfigCardColumn>
            <ConfigLabel>Model Name</ConfigLabel>
            <div className="relative">
              <ConfigInput
                type="text"
                value={model.modelName}
                onChange={(e) => onUpdate({ modelName: e.target.value })}
                onBlur={() => onMarkTouched('modelName')}
                error={showError('modelName')}
                placeholder="e.g. GPT-4o"
              />
              {showError('modelName') && (
                <div className="absolute right-2 top-2.5 h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" title={errors.modelName} />
              )}
            </div>
          </ConfigCardColumn>
          <ConfigCardColumn>
            <ConfigLabel className="flex items-center gap-1">
              Score
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="font-normal">Enter a fraction like 45/100 or a percentage like 74.5%</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </ConfigLabel>
            <ConfigInput
              type="text"
              value={model.score}
              onChange={(e) => onUpdate({ score: e.target.value })}
              onBlur={() => onMarkTouched('score')}
              error={showError('score')}
              placeholder="75/100 or 75%"
            />
          </ConfigCardColumn>
        </ConfigCardRow>

        {/* Row 2: Advanced toggle */}
        <div className="flex justify-end">
          <AdvancedToggle
            open={model.showAdvanced}
            onOpenChange={(open) => onUpdate({ showAdvanced: open })}
          />
        </div>

        {/* Advanced Content */}
        <AdvancedContent open={model.showAdvanced}>
          <ConfigCardRow columns="repeat(3, 1fr)">
            <ConfigCardColumn>
              <ConfigLabel size="small">Total Params</ConfigLabel>
              <ConfigInput
                type="number"
                value={model.totalParams}
                onChange={(e) => onUpdate({ totalParams: e.target.value })}
                size="small"
                suffix="B"
                placeholder="-"
                optional
              />
            </ConfigCardColumn>
            <ConfigCardColumn>
              <ConfigLabel size="small">Active Params</ConfigLabel>
              <ConfigInput
                type="number"
                value={model.activeParams}
                onChange={(e) => onUpdate({ activeParams: e.target.value })}
                size="small"
                suffix="B"
                placeholder="-"
                optional
              />
            </ConfigCardColumn>
            <ConfigCardColumn>
              <ConfigLabel size="small">Color</ConfigLabel>
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
            </ConfigCardColumn>
          </ConfigCardRow>
        </AdvancedContent>
      </div>
    </ConfigCard>
  );
}
