import { Plus, Trash2 } from "lucide-react";
import { getProviderGroups, getIcon } from "../../../../src/core/index.js";
import type { CustomProvider } from "./types.js";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  DropdownSeparator,
} from "@/components/common/dropdown";
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
  onDeleteCustom?: (key: string) => void;
  error?: string;
  className?: string;
}

export function ProviderSelect({
  value,
  onChange,
  customProviders,
  onAddCustomClick,
  onDeleteCustom,
  error,
  className,
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

  return (
    <div className="space-y-1">
      <Dropdown value={value} onValueChange={onChange}>
        <DropdownTrigger className={cn("h-8 text-sm", !currentDisplay && "border-dashed", error && "border-destructive", className)}>
          {currentDisplay ? (
            <span className="flex items-center gap-2">
              <img
                src={currentDisplay.isCustom && currentDisplay.iconDataUrl
                  ? currentDisplay.iconDataUrl
                  : getProviderIcon(currentDisplay.iconKey || "")}
                className="w-4 h-4 flex-shrink-0"
                alt=""
              />
              <span className="truncate">{currentDisplay.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select provider...</span>
          )}
        </DropdownTrigger>
        <DropdownContent>
          {/* Built-in providers */}
          {providerGroups.map((provider) => (
            <DropdownItem key={provider.key} value={provider.key}>
              <span className="flex items-center gap-2">
                <img
                  src={getProviderIcon(provider.iconKey)}
                  className="w-4 h-4 flex-shrink-0"
                  alt=""
                />
                <span>{provider.group}</span>
              </span>
            </DropdownItem>
          ))}

          {/* Custom providers section */}
          {customProviders.length > 0 && (
            <>
              <DropdownSeparator />
              {customProviders.map((provider) => (
                <DropdownItem key={provider.key} value={provider.key} className="pr-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      {provider.iconDataUrl ? (
                        <img src={provider.iconDataUrl} className="w-4 h-4 flex-shrink-0" alt="" />
                      ) : (
                        <span
                          className="w-4 h-4 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: provider.color }}
                        />
                      )}
                      <span>{provider.name}</span>
                    </span>
                    {onDeleteCustom && (
                      <Trash2
                        className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustom(provider.key);
                        }}
                      />
                    )}
                  </div>
                </DropdownItem>
              ))}
            </>
          )}

          {/* Add custom option */}
          <DropdownSeparator />
          <DropdownItem value="__add_custom__" onSelect={onAddCustomClick} keepOpen>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span>Custom...</span>
            </span>
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
