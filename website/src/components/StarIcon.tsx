import { Star } from "lucide-react";

/**
 * Trivial wrapper component for Lucide's Star icon.
 * This exists because Astro templates cannot use React JSX directly -
 * React components must be imported as complete components with a client:* directive.
 */
export function StarIcon() {
  return (
    <Star className="w-4 h-4 text-gray-500 fill-white group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
  );
}
