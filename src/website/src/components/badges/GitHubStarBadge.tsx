import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const githubIcon = { src: "/github.svg" };

export interface GitHubStarBadgeProps {
  className?: string;
}

export function GitHubStarBadge({ className = "" }: GitHubStarBadgeProps) {
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/DamianB-BitFlipper/llmplot")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {
        // Silently fail - badge will just not show count
      });
  }, []);

  return (
    <a
      href="https://github.com/DamianB-BitFlipper/llmplot"
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-border-accent rounded-full text-sm font-medium text-gray-700 transition-colors ${className}`}
    >
      <img src={githubIcon.src} alt="GitHub" className="w-4 h-4" />
      <span>GitHub</span>
      <Star className="w-4 h-4 fill-white stroke-gray-400 group-hover:fill-yellow-400 group-hover:stroke-yellow-400 transition-colors" />
      {starCount !== null && (
        <span className="px-1 py-0.5 border border-border-accent rounded text-xs text-secondary-foreground">
          {starCount}
        </span>
      )}
    </a>
  );
}
