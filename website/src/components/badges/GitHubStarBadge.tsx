import { Star } from "lucide-react";

interface GitHubStarBadgeProps {
  repo?: string;
  publicAssetsBaseUrl?: string;
}

export function GitHubStarBadge({ repo = "DamianB-BitFlipper/llmplot", publicAssetsBaseUrl = "" }: GitHubStarBadgeProps) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex h-9 items-center gap-2 px-3 bg-gray-100 border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
    >
      <img src={`${publicAssetsBaseUrl}/github.svg`} alt="GitHub" className="w-4 h-4" />
      <span className="text-gray-700 text-sm font-medium">GitHub</span>
      <Star className="w-4 h-4 text-gray-500 fill-white group-hover:text-yellow-500 group-hover:fill-yellow-500 transition-colors" />
      <img
        src={`https://img.shields.io/github/stars/${repo}?style=flat&label=&color=f3f4f6`}
        alt="Stars"
        className="h-5"
      />
    </a>
  );
}
