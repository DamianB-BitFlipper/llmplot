import { useState } from "react";
import { Download, PlusCircle } from "lucide-react";
import { useChartConfig, hasErrors } from "./chart/useChartConfig.js";
import { ModelCard } from "./chart/ModelCard.js";
import { AddCustomProviderModal } from "./chart/AddCustomProviderModal.js";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigCard } from "@/components/ui/config-card";
import { ConfigCardColumn } from "@/components/ui/config-card-column";
import { ConfigLabel } from "@/components/ui/config-label";
import { ConfigInput } from "@/components/ui/config-input";
import { ConfigTextarea } from "@/components/ui/config-textarea";
import { AdvancedToggle } from "@/components/ui/advanced-toggle";
import { AdvancedContent } from "@/components/ui/advanced-content";

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-8">
      {/* Form Panel */}
      <div className="space-y-4">
        {/* Chart Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Chart Details</h2>
          <ConfigCard>
            <ConfigCardColumn gap="sm">
              {/* Title + Font Row */}
              <div className="flex gap-4 items-end">
                <ConfigCardColumn className="flex-1">
                  <ConfigLabel>Title</ConfigLabel>
                  <ConfigInput
                    value={chartConfig.title}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                    placeholder="Benchmark Title"
                  />
                </ConfigCardColumn>
                <ConfigCardColumn>
                  <ConfigLabel>Font</ConfigLabel>
                  <Select
                    value={chartConfig.font}
                    onValueChange={(value) => updateConfig({ font: value as FontFamily })}
                  >
                    <SelectTrigger className="w-36 h-8 text-sm" style={{ fontFamily: fontCssFamily[chartConfig.font || "sora"] }}>
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
                </ConfigCardColumn>
              </div>

              {/* Description - Full Row, Auto-growing Textarea */}
              <ConfigCardColumn>
                <ConfigLabel>Description</ConfigLabel>
                <ConfigTextarea
                  value={chartConfig.subtitle}
                  onChange={(e) => updateConfig({ subtitle: e.target.value })}
                  placeholder="Optional description"
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

      {/* Vertical Divider */}
      <div className="hidden lg:block mt-4 -mb-4 bg-border" />

      {/* Preview Panel */}
      <div className="pt-8">
        <div 
          ref={containerRef}
          className="sticky top-8 relative border rounded-lg overflow-hidden"
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
