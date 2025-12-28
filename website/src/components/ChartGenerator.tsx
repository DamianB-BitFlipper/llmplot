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

export default function ChartGenerator() {
  const [showCustomProviderModal, setShowCustomProviderModal] = useState(false);
  
  const {
    chartConfig,
    errors,
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
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={chartConfig.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className={cn(errors.title && "border-destructive bg-destructive/10")}
              placeholder="Benchmark Title"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={chartConfig.subtitle}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsoredBy">Sponsored By</Label>
            <Input
              id="sponsoredBy"
              value={chartConfig.sponsoredBy}
              onChange={(e) => updateConfig({ sponsoredBy: e.target.value })}
              placeholder="Optional sponsor"
            />
          </div>
        </div>

        {/* Options Section */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              id="showRankings"
              checked={chartConfig.showRankings}
              onCheckedChange={(checked) => updateConfig({ showRankings: checked === true })}
            />
            <Label htmlFor="showRankings" className="cursor-pointer">
              Show Rankings
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label>Precision:</Label>
            <Select
              value={String(chartConfig.percentPrecision)}
              onValueChange={(value) => updateConfig({ percentPrecision: parseInt(value, 10) })}
            >
              <SelectTrigger className="w-20">
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
            <Label>Font:</Label>
            <Select
              value={chartConfig.font}
              onValueChange={(value) => updateConfig({ font: value })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geist Sans" style={{ fontFamily: "'Geist Sans', sans-serif" }}>Geist Sans</SelectItem>
                <SelectItem value="Inter" style={{ fontFamily: "'Inter', sans-serif" }}>Inter</SelectItem>
                <SelectItem value="Roboto" style={{ fontFamily: "'Roboto', sans-serif" }}>Roboto</SelectItem>
                <SelectItem value="Open Sans" style={{ fontFamily: "'Open Sans', sans-serif" }}>Open Sans</SelectItem>
                <SelectItem value="Lato" style={{ fontFamily: "'Lato', sans-serif" }}>Lato</SelectItem>
                <SelectItem value="Montserrat" style={{ fontFamily: "'Montserrat', sans-serif" }}>Montserrat</SelectItem>
                <SelectItem value=" " style={{ fontFamily: "system-ui, sans-serif" }}>System Default</SelectItem>
              </SelectContent>
            </Select>
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
              canRemove={chartConfig.models.length > 1}
              customProviders={chartConfig.customProviders}
              onUpdate={(updates) => updateModel(model.id, updates)}
              onRemove={() => removeModel(model.id)}
              onAddCustomProvider={() => setShowCustomProviderModal(true)}
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
