import { useState, useRef, useEffect } from "react";
import { parseYaml, processModels, renderChart, ParseError, TARGET_OUTPUT_WIDTH, calculateLayoutDimensions } from "../../../src/core/index.js";

const defaultYaml = `title: "Example Benchmark"
subtitle: "Model Performance Comparison"

models:
  - model: openai/gpt-4o
    positive: 92
    total: 100
  - model: anthropic/claude-3.5-sonnet
    positive: 89
    total: 100
  - model: gemini/gemini-2.0-flash
    positive: 85
    total: 100
`;

export default function ChartGenerator() {
  const [yaml, setYaml] = useState(defaultYaml);
  const [error, setError] = useState<string | null>(null);
  const [chartHtml, setChartHtml] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const generateChart = () => {
    try {
      const config = parseYaml(yaml);
      const models = processModels(config);
      
      // Calculate scale based on container width
      const scale = containerWidth > 0 ? containerWidth / TARGET_OUTPUT_WIDTH : 1;
      
      const html = renderChart(config, models, { mode: 'web', scale });
      setChartHtml(html);
      setError(null);
    } catch (e) {
      if (e instanceof ParseError) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred");
      }
      setChartHtml("");
    }
  };

  const downloadHtml = () => {
    try {
      const config = parseYaml(yaml);
      const models = processModels(config);
      const html = renderChart(config, models, { mode: 'web' });
      
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chart.html";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Error already shown via generateChart
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">YAML Input</h2>
          <button
            onClick={generateChart}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Chart
          </button>
        </div>
        
        <textarea
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter your YAML configuration..."
        />
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Preview</h2>
          {chartHtml && (
            <div className="flex gap-2">
              <button
                onClick={downloadHtml}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Download HTML
              </button>
            </div>
          )}
        </div>
        
        <div 
          ref={containerRef}
          className="min-h-96 p-8 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-100"
        >
          {chartHtml ? (
            <div 
              id="chart-preview"
              dangerouslySetInnerHTML={{ __html: chartHtml }} 
            />
          ) : (
            <div className="text-gray-500">
              Click "Generate Chart" to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
