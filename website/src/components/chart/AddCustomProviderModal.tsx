import { useState, useRef, useCallback } from "react";
import { X, Upload } from "lucide-react";
import type { CustomProvider } from "./types.js";

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface AddCustomProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (provider: CustomProvider) => void;
}

export function AddCustomProviderModal({
  isOpen,
  onClose,
  onAdd,
}: AddCustomProviderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState<string | undefined>();
  const [iconFileName, setIconFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const key = generateKey(name);
  const isValid = name.trim() && key;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(svg\+xml|png)$/)) {
      alert("Please upload an SVG or PNG file");
      return;
    }

    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      alert("File size must be under 100KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setIcon(event.target?.result as string);
      setIconFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    onAdd({
      key,
      name: name.trim(),
      color,
      iconDataUrl: icon,
    });

    // Reset form
    setName("");
    setColor("#6366f1");
    setIcon(undefined);
    setIconFileName("");
    onClose();
  }, [isValid, key, name, color, icon, onAdd, onClose]);

  const handleClearIcon = useCallback(() => {
    setIcon(undefined);
    setIconFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Custom Provider</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom LLM"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Key (auto-generated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key <span className="text-gray-400">(auto-generated)</span>
            </label>
            <input
              type="text"
              value={key}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Used in model string: {key || "..."}/model-name
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Icon (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon <span className="text-gray-400">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {icon ? (
              <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                <img src={icon} alt="Icon preview" className="w-8 h-8" />
                <span className="flex-1 text-sm truncate">{iconFileName}</span>
                <button
                  type="button"
                  onClick={handleClearIcon}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-500"
              >
                <Upload className="w-4 h-4" />
                <span>Choose SVG or PNG file</span>
              </button>
            )}
            <p className="text-xs text-gray-400 mt-1">Max 100KB</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
