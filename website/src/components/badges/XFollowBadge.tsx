interface XFollowBadgeProps {
  username?: string;
  publicAssetsBaseUrl?: string;
}

export function XFollowBadge({ username = "TheBitFlipper", publicAssetsBaseUrl = "" }: XFollowBadgeProps) {
  return (
    <a
      href={`https://x.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-2 px-3 bg-gray-100 border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
    >
      <img src={`${publicAssetsBaseUrl}/x-logo.svg`} alt="X" className="w-4 h-4" />
      <span className="text-gray-700 text-sm font-medium">Follow</span>
    </a>
  );
}
