import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { ModelFormData, ModelValidationErrors } from "./types.js";

interface ModelCardProps {
  model: ModelFormData;
  index: number;
  errors: ModelValidationErrors;
  canRemove: boolean;
  onUpdate: (updates: Partial<ModelFormData>) => void;
  onRemove: () => void;
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
    hasError ? "border-red-500 bg-red-50" : "border-gray-300"
  }`;

export function ModelCard({ model, index, errors, canRemove, onUpdate, onRemove }: ModelCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">Model {index + 1}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove model"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Provider</label>
          <input
            type="text"
            value={model.provider}
            onChange={(e) => onUpdate({ provider: e.target.value })}
            className={inputClass(!!errors.provider)}
            placeholder="e.g., openai"
          />
          {errors.provider && <p className="mt-1 text-xs text-red-600">{errors.provider}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model Name</label>
          <input
            type="text"
            value={model.modelName}
            onChange={(e) => onUpdate({ modelName: e.target.value })}
            className={inputClass(!!errors.modelName)}
            placeholder="e.g., gpt-4o"
          />
          {errors.modelName && <p className="mt-1 text-xs text-red-600">{errors.modelName}</p>}
        </div>
      </div>

      {/* Score Mode */}
      <div className="space-y-2">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={model.scoreMode === 'fraction'}
              onChange={() => onUpdate({ scoreMode: 'fraction' })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Fraction</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={model.scoreMode === 'percent'}
              onChange={() => onUpdate({ scoreMode: 'percent' })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Percent</span>
          </label>
        </div>

        {model.scoreMode === 'fraction' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Positive</label>
              <input
                type="number"
                value={model.positive}
                onChange={(e) => onUpdate({ positive: e.target.value })}
                className={inputClass(!!errors.positive)}
                placeholder="e.g., 92"
                min="0"
              />
              {errors.positive && <p className="mt-1 text-xs text-red-600">{errors.positive}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Total</label>
              <input
                type="number"
                value={model.total}
                onChange={(e) => onUpdate({ total: e.target.value })}
                className={inputClass(!!errors.total)}
                placeholder="e.g., 100"
                min="1"
              />
              {errors.total && <p className="mt-1 text-xs text-red-600">{errors.total}</p>}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Percent</label>
            <input
              type="number"
              value={model.percent}
              onChange={(e) => onUpdate({ percent: e.target.value })}
              className={inputClass(!!errors.percent)}
              placeholder="e.g., 92"
              min="0"
              max="100"
              step="0.1"
            />
            {errors.percent && <p className="mt-1 text-xs text-red-600">{errors.percent}</p>}
          </div>
        )}
      </div>

      {/* Advanced Section */}
      <div>
        <button
          type="button"
          onClick={() => onUpdate({ showAdvanced: !model.showAdvanced })}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {model.showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Advanced
        </button>

        {model.showAdvanced && (
          <div className="mt-3 space-y-3 pl-5 border-l-2 border-gray-200">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Display Name</label>
              <input
                type="text"
                value={model.displayName}
                onChange={(e) => onUpdate({ displayName: e.target.value })}
                className={inputClass(false)}
                placeholder="Override display label"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Total Params (B)</label>
                <input
                  type="number"
                  value={model.totalParams}
                  onChange={(e) => onUpdate({ totalParams: e.target.value })}
                  className={inputClass(!!errors.totalParams)}
                  placeholder="e.g., 175"
                  min="1"
                />
                {errors.totalParams && <p className="mt-1 text-xs text-red-600">{errors.totalParams}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Active Params (B)</label>
                <input
                  type="number"
                  value={model.activeParams}
                  onChange={(e) => onUpdate({ activeParams: e.target.value })}
                  className={inputClass(!!errors.activeParams)}
                  placeholder="e.g., 32"
                  min="1"
                />
                {errors.activeParams && <p className="mt-1 text-xs text-red-600">{errors.activeParams}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Color Override</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={model.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className={`flex-1 ${inputClass(!!errors.color)}`}
                  placeholder="#FF5733"
                />
                <input
                  type="color"
                  value={model.color || "#000000"}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="w-10 h-10 p-1 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
