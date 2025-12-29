const githubIcon = { src: "/github.svg" };

export interface GitHubStarBadgeProps {
  className?: string;
}

export function GitHubStarBadge({ className = "" }: GitHubStarBadgeProps) {
  return (
    <a
      href="https://github.com/DamianB-BitFlipper/llmplot"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-border-secondary rounded-full text-sm font-medium text-gray-700 transition-colors ${className}`}
    >
      <img src={githubIcon.src} alt="GitHub" className="w-4 h-4" />
      <span>GitHub</span>
      <svg
        className="w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
      <span className="text-gray-500">0</span>
    </a>
  );
}
