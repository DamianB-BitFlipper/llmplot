import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { XFollowBadge } from "@/components/badges/XFollowBadge";
import { GitHubStarBadge } from "@/components/badges/GitHubStarBadge";
import { BuyMeCoffeeBadge } from "@/components/badges/BuyMeCoffeeBadge";

const STORAGE_KEY = "llmplot-hide-support-modal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicAssetsBaseUrl?: string;
}

export function SupportModal({ isOpen, onClose, publicAssetsBaseUrl = "/" }: SupportModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          {/* Profile image */}
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
            <img
              src={`${publicAssetsBaseUrl.replace(/\/$/, "")}/damian.jpg`}
              alt="Damian Barabonkov"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Made by text */}
          <p className="text-xl text-gray-500 mb-3">
            made by <span className="font-bold text-gray-900">Damian Barabonkov</span>
          </p>

          {/* Main text */}
          <p className="text-lg text-gray-900 leading-snug">
            The <span className="underline font-semibold">best way you can support me for free</span> is by
          </p>
          <p className="text-lg text-gray-900 leading-snug">
            following me on and starring this repo.
          </p>

          {/* Secondary text */}
          <p className="text-sm text-gray-500 mt-1 mb-5 flex items-center gap-1 leading-snug">
            Not into socials? A coffee will do instead.
            <Heart className="w-4 h-4 text-gray-400" />
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <XFollowBadge publicAssetsBaseUrl={publicAssetsBaseUrl} />
            <GitHubStarBadge publicAssetsBaseUrl={publicAssetsBaseUrl} />
            <BuyMeCoffeeBadge />
          </div>

          {/* Checkbox and Skip on same row */}
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label
                htmlFor="dontShowAgain"
                className="text-sm text-gray-500 cursor-pointer"
              >
                Don't show again
              </label>
            </div>

            <Button
              variant="outline"
              onClick={handleClose}
            >
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function shouldShowSupportModal(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== "true";
}
