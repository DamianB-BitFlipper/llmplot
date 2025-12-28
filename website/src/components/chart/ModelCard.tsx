import type { ModelConfig, ModelValidationErrors, CustomProvider } from "./types.js";
import { ProviderSelect } from "./ProviderSelect.js";
import { Input } from "@/components/ui/input";
import { ConfigCard } from "@/components/ui/config-card";
import { ConfigCardRow } from "@/components/ui/config-card-row";
import { ConfigCardColumn } from "@/components/ui/config-card-column";
import { ConfigLabel } from "@/components/ui/config-label";
import { ConfigInput } from "@/components/ui/config-input";
import { AdvancedToggle } from "@/components/ui/advanced-toggle";
import { AdvancedContent } from "@/components/ui/advanced-content";
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
    <ConfigCard onRemove={onRemove} canRemove={canRemove}>
      <div className="space-y-2">
        {/* Row 1: Provider & Model Name */}
        <ConfigCardRow columns="140px 1fr">
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
        </ConfigCardRow>

        {/* Row 2: Format & Score */}
        <ConfigCardRow columns="140px 1fr">
          <ConfigCardColumn>
            <ConfigLabel>Format</ConfigLabel>
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
          </ConfigCardColumn>
          
          <div className="flex items-end">
            {model.scoreMode === 'fraction' ? (
              <>
                <ConfigCardColumn>
                  <ConfigLabel>Passed</ConfigLabel>
                  <ConfigInput
                    type="number"
                    value={model.passed}
                    onChange={(e) => onUpdate({ passed: e.target.value })}
                    onBlur={() => onMarkTouched('passed')}
                    error={showError('passed')}
                    placeholder="75"
                    min={0}
                    className="w-20"
                  />
                </ConfigCardColumn>
                <span className="h-8 flex items-center justify-center text-muted-foreground font-light text-sm px-1">/</span>
                <ConfigCardColumn>
                  <ConfigLabel>Total</ConfigLabel>
                  <ConfigInput
                    type="number"
                    value={model.total}
                    onChange={(e) => onUpdate({ total: e.target.value })}
                    onBlur={() => onMarkTouched('total')}
                    error={showError('total')}
                    placeholder="100"
                    min={1}
                    className="w-20"
                  />
                </ConfigCardColumn>
              </>
            ) : (
              <ConfigCardColumn>
                <ConfigLabel>Percentage</ConfigLabel>
                <ConfigInput
                  type="number"
                  value={model.percent}
                  onChange={(e) => onUpdate({ percent: e.target.value })}
                  onBlur={() => onMarkTouched('percent')}
                  error={showError('percent')}
                  placeholder="74.2"
                  min={0}
                  max={100}
                  step={0.1}
                  suffix="%"
                  className="w-20"
                />
              </ConfigCardColumn>
            )}

            {/* Advanced toggle */}
            <div className="flex-1 flex justify-end">
              <AdvancedToggle
                open={model.showAdvanced}
                onOpenChange={(open) => onUpdate({ showAdvanced: open })}
              />
            </div>
          </div>
        </ConfigCardRow>

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
