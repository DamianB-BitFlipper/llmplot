import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { useChartConfig, hasErrors } from "./chart/useChartConfig.js";
import { ModelCard } from "./chart/ModelCard.js";
import { AddCustomProviderModal } from "./chart/AddCustomProviderModal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { fontFamilies, fontDisplayNames, type FontFamily } from "./chart/types.js";

// Map font family keys to their CSS font-family values
const fontCssFamily: Record<FontFamily, string> = {
  "geist": "'Geist', sans-serif",
  "inter": "'Inter', sans-serif",
  "ibm-plex-sans": "'IBM Plex Sans', sans-serif",
  "libre-baskerville": "'Libre Baskerville', serif",
  "manrope": "'Manrope', sans-serif",
  "sora": "'Sora', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
};

export default function ChartGenerator() {
  const [showCustomProviderModal, setShowCustomProviderModal] = useState(false);
  
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
    downloadHtml,
  } = useChartConfig();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Panel */}
      <div className="space-y-4">
        {/* Header & Options Compact Section */}
        <div className="p-3 border rounded-lg bg-card space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-4 space-y-1">
              <Label htmlFor="title" className="text-[10px] uppercase text-muted-foreground font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={chartConfig.title}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className={cn("h-8 text-sm", errors.title && "border-destructive bg-destructive/10")}
                placeholder="Benchmark Title"
              />
            </div>

            <div className="col-span-6 md:col-span-4 space-y-1">
              <Label htmlFor="subtitle" className="text-[10px] uppercase text-muted-foreground font-semibold">Subtitle</Label>
              <Input
                id="subtitle"
                value={chartConfig.subtitle}
                onChange={(e) => updateConfig({ subtitle: e.target.value })}
                placeholder="Optional description"
                className="h-8 text-sm"
              />
            </div>

            <div className="col-span-6 md:col-span-4 space-y-1">
              <Label htmlFor="sponsoredBy" className="text-[10px] uppercase text-muted-foreground font-semibold">Sponsored By</Label>
              <Input
                id="sponsoredBy"
                value={chartConfig.sponsoredBy}
                onChange={(e) => updateConfig({ sponsoredBy: e.target.value })}
                placeholder="Optional sponsor"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="showRankings"
                checked={chartConfig.showRankings}
                onCheckedChange={(checked) => updateConfig({ showRankings: checked === true })}
              />
              <Label htmlFor="showRankings" className="text-xs cursor-pointer font-medium">
                Show Rankings
              </Label>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Precision</Label>
                <Select
                  value={String(chartConfig.percentPrecision)}
                  onValueChange={(value) => updateConfig({ percentPrecision: parseInt(value, 10) })}
                >
                  <SelectTrigger className="w-12 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-muted-foreground">Font</Label>
                <Select
                  value={chartConfig.font}
                  onValueChange={(value) => updateConfig({ font: value as FontFamily })}
                >
                  <SelectTrigger className="w-32 h-7 text-xs" style={{ fontFamily: fontCssFamily[chartConfig.font || "sora"] }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem 
                        key={font} 
                        value={font}
                        style={{ fontFamily: fontCssFamily[font] }}
                      >
                        {fontDisplayNames[font]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Models Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Models</h3>
          
          {chartConfig.models.map((model, index) => (
            <ModelCard
              key={model.id}
              model={model}
              index={index}
              errors={errors.models[model.id] || {}}
              touched={touched[model.id] || {}}
              showAllErrors={showAllErrors}
              canRemove={chartConfig.models.length > 1}
              customProviders={chartConfig.customProviders}
              onUpdate={(updates) => updateModel(model.id, updates)}
              onRemove={() => removeModel(model.id)}
              onAddCustomProvider={() => setShowCustomProviderModal(true)}
              onMarkTouched={(field) => markTouched(model.id, field)}
            />
          ))}

          <Button
            variant="outline"
            onClick={addModel}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <div 
          ref={containerRef}
          className="sticky top-4 relative border rounded-lg overflow-hidden"
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-muted/50 z-20" />
          )}
          {chartHtml && (
            <Button
              variant="outline"
              size="icon"
              onClick={downloadHtml}
              className="absolute top-3 right-3 z-10 bg-background/80 hover:bg-background"
              title="Download HTML"
            >
              <Download className="w-5 h-5" />
            </Button>
          )}
          {chartHtml ? (
            <div 
              id="chart-preview"
              dangerouslySetInnerHTML={{ __html: chartHtml }} 
            />
          ) : (
            <div className="text-muted-foreground p-8 text-center bg-muted min-h-64 flex items-center justify-center">
              {hasErrors(errors) ? "Fix validation errors to preview" : "Enter data to preview chart"}
            </div>
          )}
        </div>
      </div>

      {/* Custom Provider Modal */}
      <AddCustomProviderModal
        isOpen={showCustomProviderModal}
        onClose={() => setShowCustomProviderModal(false)}
        onAdd={addCustomProvider}
      />
    </div>
  );
}
