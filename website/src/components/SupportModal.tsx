import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { XFollowBadge } from "./badges/XFollowBadge";
import { GitHubStarBadge } from "./badges/GitHubStarBadge";
import { BuyMeCoffeeBadge } from "./badges/BuyMeCoffeeBadge";
import { Heart } from "lucide-react";
const damianImg = { src: "/damian.jpg" };

const STORAGE_KEY = "llmplot-hide-support-modal";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg pt-8 pb-8" hideCloseButton>
        <div className="flex flex-col items-center text-center">
          {/* Profile image */}
          <div className="w-44 h-44 rounded-full border-4 border-gray-200 overflow-hidden mb-3">
            <img
              src={damianImg.src}
              alt="Damian Barabonkov"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Made by text */}
          <p className="text-xl text-gray-500 mb-5">
            made by <span className="font-bold text-gray-900">Damian Barabonkov</span>
          </p>

          <p className="text-lg font-medium leading-snug">
            The <u className="font-bold">best way you can support me for free</u> is by
          </p>
          <p className="text-lg font-medium leading-snug">
            following me on and starring this repo.
          </p>
          <p className="text-sm text-gray-500 mt-1 mb-5 leading-snug">
            Not into socials? A coffee will do instead.{" "}
<Heart className="inline-block w-4 h-4 text-gray-400" />
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <XFollowBadge />
            <GitHubStarBadge />
            <BuyMeCoffeeBadge />
          </div>
        </div>

        <DialogFooter className="mt-6 flex-row items-center justify-between sm:justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dont-show"
              className="text-sm text-gray-600 cursor-pointer"
            >
              Don't show again
            </label>
          </div>
          <Button variant="outline" onClick={handleClose}>
            Skip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
