import { useState, useRef, useCallback } from "react";
import { Download, PlusCircle, ChevronRight } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [headerAdvancedOpen, setHeaderAdvancedOpen] = useState(false);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  
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
        <div className="pt-2 pb-3 px-3 border rounded-lg bg-card space-y-2">
          {/* Title - Full Row */}
          <div>
            <Label htmlFor="title" className="text-xs text-muted-foreground font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={chartConfig.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className={cn("h-8 text-sm mt-1", !chartConfig.title && "border-dashed")}
              placeholder="Benchmark Title"
            />
          </div>

          {/* Subtitle - Full Row, Auto-growing Textarea */}
          <div>
            <Label htmlFor="subtitle" className="text-xs text-muted-foreground font-medium">Subtitle</Label>
            <textarea
              ref={subtitleRef}
              id="subtitle"
              value={chartConfig.subtitle}
              onChange={(e) => {
                updateConfig({ subtitle: e.target.value });
                // Auto-grow logic
                const textarea = e.target;
                textarea.style.height = 'auto';
                const lineHeight = 20;
                const maxHeight = lineHeight * 3; // 3 rows max before scroll
                textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
              }}
              placeholder="Optional description"
              rows={1}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto mt-1",
                !chartConfig.subtitle && "border-dashed"
              )}
              style={{ minHeight: '32px', maxHeight: '60px' }}
            />
          </div>

          {/* Advanced Section - Collapsible, styled like ModelCard */}
          <Collapsible open={headerAdvancedOpen} onOpenChange={setHeaderAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 -ml-2">
                <span className="font-medium">Advanced</span>
                <ChevronRight className={cn("h-3 w-3 transition-transform", headerAdvancedOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-x-4 gap-y-3 items-end bg-muted/20 p-2 rounded-md border border-dashed">
                <div className="space-y-1">
                  <Label htmlFor="sponsoredBy" className="text-[9px] text-muted-foreground uppercase font-semibold">Sponsored By</Label>
                  <Input
                    id="sponsoredBy"
                    value={chartConfig.sponsoredBy}
                    onChange={(e) => updateConfig({ sponsoredBy: e.target.value })}
                    placeholder="Optional"
                    className={cn("h-7 text-xs w-32 bg-background", !chartConfig.sponsoredBy && "border-dashed")}
                  />
                </div>

                <div className="flex items-center gap-2 h-7">
                  <Checkbox
                    id="showRankings"
                    checked={chartConfig.showRankings}
                    onCheckedChange={(checked) => updateConfig({ showRankings: checked === true })}
                  />
                  <Label htmlFor="showRankings" className="text-xs cursor-pointer font-medium">
                    Show Rankings
                  </Label>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Precision</Label>
                  <Select
                    value={String(chartConfig.percentPrecision)}
                    onValueChange={(value) => updateConfig({ percentPrecision: parseInt(value, 10) })}
                  >
                    <SelectTrigger className="w-14 h-7 text-xs bg-background">
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

                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground uppercase font-semibold">Font</Label>
                  <Select
                    value={chartConfig.font}
                    onValueChange={(value) => updateConfig({ font: value as FontFamily })}
                  >
                    <SelectTrigger className="w-28 h-7 text-xs bg-background" style={{ fontFamily: fontCssFamily[chartConfig.font || "sora"] }}>
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
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Models Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Models</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addModel}
              className="border-dashed"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Model
            </Button>
          </div>
          
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
