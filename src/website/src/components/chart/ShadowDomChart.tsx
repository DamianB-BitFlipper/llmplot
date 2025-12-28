import { useEffect, useRef } from "react";

interface ShadowDomChartProps {
  id: string;
  html: string;
}

/**
 * Renders HTML content inside a Shadow DOM to isolate it from the page's CSS.
 * This prevents the website's Tailwind CSS from conflicting with the chart's
 * Twind-generated styles.
 */
export function ShadowDomChart({ id, html }: ShadowDomChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // Create shadow root only once
    if (!shadowRootRef.current) {
      shadowRootRef.current = hostRef.current.attachShadow({ mode: "open" });
    }

    // Update shadow DOM content
    shadowRootRef.current.innerHTML = `
      <div style="display: flex; justify-content: center;">
        ${html}
      </div>
    `;
  }, [html]);

  return <div id={id} ref={hostRef} />;
}
