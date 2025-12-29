import { useState, useRef, useCallback } from "react";
import { X, Upload } from "lucide-react";
import type { CustomProvider } from "./types.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  onAdd: (provider: CustomProvider, oldKey?: string) => void;
  editingProvider?: CustomProvider;
}

export function AddCustomProviderModal({
  isOpen,
  onClose,
  onAdd,
  editingProvider,
}: AddCustomProviderModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState<string | undefined>();
  const [iconFileName, setIconFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when editingProvider changes
  const editingKeyRef = useRef<string | undefined>();
  if (editingProvider && editingProvider.key !== editingKeyRef.current) {
    editingKeyRef.current = editingProvider.key;
    setName(editingProvider.name);
    setColor(editingProvider.color);
    setIcon(editingProvider.iconDataUrl);
    setIconFileName(editingProvider.iconDataUrl ? "Current icon" : "");
  } else if (!editingProvider && editingKeyRef.current) {
    editingKeyRef.current = undefined;
  }

  const isEditing = !!editingProvider;
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

    onAdd(
      {
        key,
        name: name.trim(),
        color,
        iconDataUrl: icon,
      },
      isEditing ? editingProvider?.key : undefined
    );

    // Reset form
    setName("");
    setColor("#6366f1");
    setIcon(undefined);
    setIconFileName("");
    editingKeyRef.current = undefined;
    onClose();
  }, [isValid, key, name, color, icon, isEditing, editingProvider?.key, onAdd, onClose]);

  const handleClearIcon = useCallback(() => {
    setIcon(undefined);
    setIconFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    // Reset form on close
    setName("");
    setColor("#6366f1");
    setIcon(undefined);
    setIconFileName("");
    editingKeyRef.current = undefined;
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Custom Provider" : "Add Custom Provider"}</DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="provider-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Custom LLM"
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>
              Color <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-input"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          {/* Icon (optional) */}
          <div className="space-y-2">
            <Label>
              Icon <span className="text-muted-foreground">(optional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,.png,image/svg+xml,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {icon ? (
              <div className="flex items-center gap-3 p-3 border border-input rounded-md bg-muted">
                <img src={icon} alt="Icon preview" className="w-8 h-8" />
                <span className="flex-1 text-sm truncate">{iconFileName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearIcon}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-dashed"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose SVG or PNG file
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Max 100KB</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isValid}>
            {isEditing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
