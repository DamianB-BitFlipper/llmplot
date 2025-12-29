import { useState, useRef } from "react";
import { ArrowDownToLine, ChevronDown, Download, PlusCircle, Save, FileCode, Image as ImageIcon, Shapes, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useChartConfig, hasErrors, formatErrors } from "./chart/useChartConfig.js";
import { ModelCard } from "./chart/ModelCard.js";
import { AddCustomProviderModal } from "./chart/AddCustomProviderModal.js";
import { ShadowDomChart } from "./chart/ShadowDomChart.js";
import { SupportModal } from "./SupportModal.js";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/common/dropdown";
import { ConfigCard } from "@/components/config-card/config-card";
import { ConfigCardColumn } from "@/components/config-card/config-card-column";
import { ConfigLabel } from "@/components/config-card/config-label";
import { ConfigInput } from "@/components/config-card/config-input";
import { ConfigTextarea } from "@/components/config-card/config-textarea";
import { AdvancedToggle } from "@/components/common/advanced-toggle";
import { AdvancedContent } from "@/components/common/advanced-content";

import { fontFamilies, fontConfig, type FontFamily } from "./chart/types.js";

export default function ChartGenerator() {
  const [showCustomProviderModal, setShowCustomProviderModal] = useState(false);
  const [customProviderTargetModelId, setCustomProviderTargetModelId] = useState<string | null>(null);
  const [headerAdvancedOpen, setHeaderAdvancedOpen] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  const {
    chartConfig,
    errors,
    touched,
    showAllErrors,
    markTouched,
    chartHtml,
    isGenerating,
    containerRef,
    updateConfig,
    updateModel,
    addModel,
    removeModel,
    addCustomProvider,
    removeCustomProvider,
    downloadHtml,
    downloadPng,
    downloadSvg,
    downloadYaml,
    importYaml,
    restoreSampleData,
  } = useChartConfig();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = importYaml(text);
      if (!result.success) {
        toast.error("Import failed", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Import failed", {
        description: "Could not read file",
      });
    }

    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  const shouldShowSupportModal = () => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("llmplot-hide-support-modal") !== "true";
  };

  const handleDownloadHtml = () => {
    const success = downloadHtml();
    if (success && shouldShowSupportModal()) {
      setShowSupportModal(true);
    }
  };

  const handleDownloadPng = async () => {
    const success = await downloadPng();
    if (success && shouldShowSupportModal()) {
      setShowSupportModal(true);
    }
  };

  const handleDownloadSvg = async () => {
    const success = await downloadSvg();
    if (success && shouldShowSupportModal()) {
      setShowSupportModal(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-8">
      {/* Form Panel */}
      <div className="space-y-4">
        {/* Chart Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chart Details</h2>
          <TooltipProvider delayDuration={300}>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileChange}
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleImportClick}
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load Config</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={restoreSampleData}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restore Sample Data</TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadYaml}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Config
              </Button>
            </div>
          </TooltipProvider>
        </div>
        <div className="space-y-2">
          <ConfigCard>
            <ConfigCardColumn gap="sm">
              {/* Title + Font Row */}
              <div className="flex gap-4 items-end">
                <ConfigCardColumn className="flex-1">
                  <ConfigLabel>Title</ConfigLabel>
                  <ConfigInput
                    value={chartConfig.title}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                    placeholder="Graph Title"
                  />
                </ConfigCardColumn>
                <ConfigCardColumn>
                  <ConfigLabel>Font</ConfigLabel>
                  <Dropdown
                    value={chartConfig.font}
                    onValueChange={(value) => updateConfig({ font: value as FontFamily })}
                  >
                    <DropdownTrigger className="w-36 h-8 text-sm" style={{ fontFamily: fontConfig[chartConfig.font || "sora"].css }}>
                      {fontConfig[chartConfig.font || "sora"].display}
                    </DropdownTrigger>
                    <DropdownContent>
                      {fontFamilies.map((font) => (
                        <DropdownItem 
                          key={font} 
                          value={font}
                          style={{ fontFamily: fontConfig[font].css }}
                        >
                          {fontConfig[font].display}
                        </DropdownItem>
                      ))}
                    </DropdownContent>
                  </Dropdown>
                </ConfigCardColumn>
              </div>

              {/* Description - Full Row, Auto-growing Textarea */}
              <ConfigCardColumn>
                <ConfigLabel>Description</ConfigLabel>
                <ConfigTextarea
                  value={chartConfig.description}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Optional Description"
                  maxRows={3}
                />
              </ConfigCardColumn>

              {/* Advanced Toggle */}
              <div className="flex justify-end">
                <AdvancedToggle 
                  open={headerAdvancedOpen} 
                  onOpenChange={setHeaderAdvancedOpen}
                />
              </div>

              {/* Advanced Content */}
              <AdvancedContent open={headerAdvancedOpen}>
                <div className="flex items-end justify-between gap-4">
                  <ConfigCardColumn>
                    <ConfigLabel size="small">Sponsored By</ConfigLabel>
                    <ConfigInput
                      value={chartConfig.sponsoredBy}
                      onChange={(e) => updateConfig({ sponsoredBy: e.target.value })}
                      placeholder="Optional Sponsor"
                      size="small"
                      className="w-44"
                    />
                  </ConfigCardColumn>

                  <div className="flex items-end gap-4">
                    <div className="flex items-center gap-2 h-7">
                      <Checkbox
                        id="showRankings"
                        checked={chartConfig.showRankings}
                        onCheckedChange={(checked) => updateConfig({ showRankings: checked === true })}
                      />
                      <ConfigLabel htmlFor="showRankings" className="cursor-pointer">
                        Show Rankings
                      </ConfigLabel>
                    </div>

                    <ConfigCardColumn>
                      <ConfigLabel size="small">Precision</ConfigLabel>
                      <Dropdown
                        value={String(chartConfig.percentPrecision)}
                        onValueChange={(value) => updateConfig({ percentPrecision: parseInt(value, 10) })}
                      >
                        <DropdownTrigger className="w-14 h-7 text-xs bg-background">
                          {chartConfig.percentPrecision}
                        </DropdownTrigger>
                        <DropdownContent>
                          <DropdownItem value="0">0</DropdownItem>
                          <DropdownItem value="1">1</DropdownItem>
                          <DropdownItem value="2">2</DropdownItem>
                          <DropdownItem value="3">3</DropdownItem>
                        </DropdownContent>
                      </Dropdown>
                    </ConfigCardColumn>
                  </div>
                </div>
              </AdvancedContent>
            </ConfigCardColumn>
          </ConfigCard>
        </div>

        {/* Models Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Models</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addModel}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Model
            </Button>
          </div>
          
          {chartConfig.models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              errors={errors.models[model.id] || {}}
              touched={touched[model.id] || {}}
              showAllErrors={showAllErrors}
              canRemove={chartConfig.models.length > 1}
              customProviders={chartConfig.customProviders}
              onUpdate={(updates) => updateModel(model.id, updates)}
              onRemove={() => removeModel(model.id)}
              onAddCustomProvider={() => {
                setCustomProviderTargetModelId(model.id);
                setShowCustomProviderModal(true);
              }}
              onDeleteCustomProvider={removeCustomProvider}
              onMarkTouched={(field) => markTouched(model.id, field)}
            />
          ))}
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="hidden lg:block mt-4 -mb-4 bg-border" />

      {/* Preview Panel */}
      <div className="pt-8 min-w-0">
        {/* Measurement div - not affected by chart content */}
        <div ref={containerRef} className="w-full" />
        <div 
          className="sticky top-8 relative border rounded-lg overflow-hidden"
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-muted/50 z-20" />
          )}
          {chartHtml && (
            <div className="absolute top-3 right-3 z-10 flex rounded-md shadow-sm isolate">
              <Button
                variant="outline"
                className="rounded-r-none border-r-0 bg-background/80 hover:bg-background backdrop-blur-sm focus:z-10 h-auto py-2 px-3"
                    onClick={handleDownloadPng}
              >
                <Download className="w-4 h-4 mr-3" />
<div className="flex flex-col items-center leading-tight">
                                  <span className="text-sm font-medium">Download</span>
                                  <span className="text-[11px] text-muted-foreground">PNG</span>
                                </div>
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-l-none px-2 bg-background/80 hover:bg-background backdrop-blur-sm [&[data-state=open]_.chevron]:rotate-180 transition-all focus:z-10 h-auto py-2"
                  >
                    <ChevronDown className="w-4 h-4 chevron transition-transform duration-200" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-1">
                  <button
                onClick={handleDownloadPng}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    PNG
                  </button>
                  <button
                    onClick={handleDownloadSvg}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <Shapes className="w-4 h-4" />
                    SVG
                  </button>
                  <button
                    onClick={handleDownloadHtml}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" />
                    HTML
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          )}
          {chartHtml ? (
            <ShadowDomChart id="chart-preview" html={chartHtml} />
          ) : chartHtml === null ? (
            // Not yet generated - show nothing to avoid flash
            null
          ) : hasErrors(errors) ? (
            <div className="p-8 text-center bg-muted min-h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-left">
                <p className="font-medium mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {formatErrors(errors).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-muted min-h-64 flex items-center justify-center text-muted-foreground">
              Failed to render chart
            </div>
          )}
        </div>
      </div>

      {/* Custom Provider Modal */}
      <AddCustomProviderModal
        isOpen={showCustomProviderModal}
        onClose={() => {
          setShowCustomProviderModal(false);
          setCustomProviderTargetModelId(null);
        }}
        onAdd={(provider) => {
          addCustomProvider(provider);
          // Auto-select the new provider for the model that triggered the modal
          if (customProviderTargetModelId) {
            updateModel(customProviderTargetModelId, { provider: provider.key });
          }
          setShowCustomProviderModal(false);
          setCustomProviderTargetModelId(null);
        }}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </div>
  );
}
