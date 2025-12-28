import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { getProviderGroups, getIcon } from "../../../../src/core/index.js";

/** Get inline SVG for a provider by icon key */
function getProviderIcon(iconKey: string): string {
  return getIcon(iconKey);
}
import type { CustomProvider } from "./types.js";

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const providerGroups = getProviderGroups();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border rounded-lg bg-white flex items-center gap-2 ${
          error ? "border-red-500" : "border-gray-300"
        } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {currentDisplay ? (
          <>
            <img
              src={currentDisplay.isCustom && currentDisplay.iconDataUrl
                ? currentDisplay.iconDataUrl
                : getProviderIcon(currentDisplay.iconKey || "")}
              className="w-5 h-5 flex-shrink-0"
              alt=""
            />
            <span className="flex-1 truncate">{currentDisplay.name}</span>
          </>
        ) : (
          <span className="text-gray-400 flex-1">Select provider...</span>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* Built-in providers */}
          {providerGroups.map((provider) => (
            <button
              key={provider.key}
              type="button"
              onClick={() => {
                onChange(provider.key);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${
                value === provider.key ? "bg-blue-50" : ""
              }`}
            >
              <img
                src={getProviderIcon(provider.iconKey)}
                className="w-5 h-5 flex-shrink-0"
                alt=""
              />
              <span className="flex-1">{provider.group}</span>
            </button>
          ))}

          {/* Custom providers section */}
          {customProviders.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1" />
              {customProviders.map((provider) => (
                <button
                  key={provider.key}
                  type="button"
                  onClick={() => {
                    onChange(provider.key);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${
                    value === provider.key ? "bg-blue-50" : ""
                  }`}
                >
                  {provider.iconDataUrl ? (
                    <img src={provider.iconDataUrl} className="w-5 h-5 flex-shrink-0" alt="" />
                  ) : (
                    <span
                      className="w-5 h-5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: provider.color }}
                    />
                  )}
                  <span className="flex-1">{provider.name}</span>
                </button>
              ))}
            </>
          )}

          {/* Add custom option */}
          <div className="border-t border-gray-200 my-1" />
          <button
            type="button"
            onClick={() => {
              onAddCustomClick();
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 text-gray-600"
          >
            <Plus className="w-5 h-5" />
            <span>Custom...</span>
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
