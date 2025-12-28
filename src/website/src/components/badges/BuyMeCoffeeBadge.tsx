interface BuyMeCoffeeBadgeProps {
  username?: string;
}

export function BuyMeCoffeeBadge({ username = "thebitflipper" }: BuyMeCoffeeBadgeProps) {
  return (
    <a
      href={`https://www.buymeacoffee.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        className="h-9 w-auto"
      />
    </a>
  );
}
