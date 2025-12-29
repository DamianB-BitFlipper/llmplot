import { useEffect, useRef } from "react";

interface ShadowDomChartProps {
  id: string;
  html: string;
}

/**
 * Extracts @font-face information from HTML and loads the font at the document level.
 * This is necessary because @font-face declarations inside Shadow DOM don't work
 * reliably - the browser's font system operates at the document level.
 */
function loadFontFromHtml(html: string): void {
  // Extract font-family and src URL from @font-face rule
  const fontFaceMatch = html.match(
    /@font-face\s*\{\s*font-family:\s*'([^']+)';\s*src:\s*url\(([^)]+)\)/
  );

  if (!fontFaceMatch) return;

  const [, fontFamily, fontUrl] = fontFaceMatch;

  // Check if this font is already loaded
  const isLoaded = Array.from(document.fonts).some(
    (font) => font.family === fontFamily
  );
  if (isLoaded) return;

  // Use FontFace API to load font at document level
  const font = new FontFace(fontFamily, `url(${fontUrl})`);
  font
    .load()
    .then((loadedFont) => {
      document.fonts.add(loadedFont);
    })
    .catch((err) => {
      console.warn(`Failed to load font "${fontFamily}":`, err);
    });
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

    // Load font at document level (Shadow DOM can't load @font-face reliably)
    loadFontFromHtml(html);

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
