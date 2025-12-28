import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { useChartConfig, hasErrors } from "./chart/useChartConfig.js";
import { ModelCard } from "./chart/ModelCard.js";
import { AddCustomProviderModal } from "./chart/AddCustomProviderModal.js";

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    hasError ? "border-red-500 bg-red-50" : "border-gray-300"
  }`;

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={chartConfig.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className={inputClass(!!errors.title)}
              placeholder="Benchmark Title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={chartConfig.subtitle}
              onChange={(e) => updateConfig({ subtitle: e.target.value })}
              className={inputClass(false)}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsored By</label>
            <input
              type="text"
              value={chartConfig.sponsoredBy}
              onChange={(e) => updateConfig({ sponsoredBy: e.target.value })}
              className={inputClass(false)}
              placeholder="Optional sponsor"
            />
          </div>
        </div>

        {/* Options Section */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={chartConfig.showRankings}
              onChange={(e) => updateConfig({ showRankings: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Rankings</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Precision:</label>
            <select
              value={chartConfig.percentPrecision}
              onChange={(e) => updateConfig({ percentPrecision: parseInt(e.target.value, 10) })}
              className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Font:</label>
            <select
              value={chartConfig.font}
              onChange={(e) => updateConfig({ font: e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Geist Sans">Geist Sans</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="">System Default</option>
            </select>
          </div>
        </div>

        {/* Models Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Models</h3>
          
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

          <button
            onClick={addModel}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Model
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <div 
          ref={containerRef}
          className="sticky top-4 relative border border-gray-300 rounded-lg overflow-hidden"
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-gray-500/20 z-20" />
          )}
          {chartHtml && (
            <button
              onClick={downloadHtml}
              className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors z-10"
              title="Download HTML"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {chartHtml ? (
            <div 
              id="chart-preview"
              dangerouslySetInnerHTML={{ __html: chartHtml }} 
            />
          ) : (
            <div className="text-gray-500 p-8 text-center bg-gray-50 min-h-64 flex items-center justify-center">
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
