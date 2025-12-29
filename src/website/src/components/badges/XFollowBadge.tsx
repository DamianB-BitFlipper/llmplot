const xLogoIcon = { src: "/x-logo.svg" };

export interface XFollowBadgeProps {
  className?: string;
}

export function XFollowBadge({ className = "" }: XFollowBadgeProps) {
  return (
    <a
      href="https://x.com/dbabonern"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-border-accent rounded-full text-sm font-medium text-gray-700 transition-colors ${className}`}
    >
      <img src={xLogoIcon.src} alt="X" className="w-4 h-4" />
      <span>Follow</span>
    </a>
  );
}
