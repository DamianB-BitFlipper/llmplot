import { Plus } from "lucide-react";
import { getProviderGroups, getIcon } from "../../../../src/core/index.js";
import type { CustomProvider } from "./types.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Get inline SVG for a provider by icon key */
function getProviderIcon(iconKey: string): string {
  return getIcon(iconKey);
}

interface ProviderSelectProps {
  value: string;
  onChange: (value: string) => void;
  customProviders: CustomProvider[];
  onAddCustomClick: () => void;
  error?: string;
}

export function ProviderSelect({
  value,
  onChange,
  customProviders,
  onAddCustomClick,
  error,
}: ProviderSelectProps) {
  const providerGroups = getProviderGroups();

  // Find current selection display info
  const getCurrentDisplay = () => {
    // Check built-in providers
    const builtIn = providerGroups.find((p) => p.key === value);
    if (builtIn) {
      return { name: builtIn.group, iconKey: builtIn.iconKey, color: builtIn.color };
    }
    // Check custom providers
    const custom = customProviders.find((p) => p.key === value);
    if (custom) {
      return { name: custom.name, iconDataUrl: custom.iconDataUrl, color: custom.color, isCustom: true };
    }
    return null;
  };

  const currentDisplay = getCurrentDisplay();

  const handleValueChange = (newValue: string) => {
    if (newValue === "__add_custom__") {
      onAddCustomClick();
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder="Select provider...">
            {currentDisplay && (
              <span className="flex items-center gap-2">
                <img
                  src={currentDisplay.isCustom && currentDisplay.iconDataUrl
                    ? currentDisplay.iconDataUrl
                    : getProviderIcon(currentDisplay.iconKey || "")}
                  className="w-5 h-5 flex-shrink-0"
                  alt=""
                />
                <span className="truncate">{currentDisplay.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Built-in providers */}
          {providerGroups.map((provider) => (
            <SelectItem key={provider.key} value={provider.key}>
              <span className="flex items-center gap-2">
                <img
                  src={getProviderIcon(provider.iconKey)}
                  className="w-5 h-5 flex-shrink-0"
                  alt=""
                />
                <span>{provider.group}</span>
              </span>
            </SelectItem>
          ))}

          {/* Custom providers section */}
          {customProviders.length > 0 && (
            <>
              <SelectSeparator />
              {customProviders.map((provider) => (
                <SelectItem key={provider.key} value={provider.key}>
                  <span className="flex items-center gap-2">
                    {provider.iconDataUrl ? (
                      <img src={provider.iconDataUrl} className="w-5 h-5 flex-shrink-0" alt="" />
                    ) : (
                      <span
                        className="w-5 h-5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: provider.color }}
                      />
                    )}
                    <span>{provider.name}</span>
                  </span>
                </SelectItem>
              ))}
            </>
          )}

          {/* Add custom option */}
          <SelectSeparator />
          <SelectItem value="__add_custom__">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Plus className="w-5 h-5" />
              <span>Custom...</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
