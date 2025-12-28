import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { parseYaml, processModels, renderChart, calculateLayoutDimensions, ParseError } from "../../../src/core/index.js";

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

  // Re-render chart when container width changes or yaml changes (debounced)
  useEffect(() => {
    if (containerWidth > 0 && yaml) {
      const timeout = setTimeout(() => {
        generateChart();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [containerWidth, yaml]);

  const generateChart = () => {
    try {
      const config = parseYaml(yaml);
      const models = processModels(config);
      
      // Calculate the actual background width for proper scaling
      const dimensions = calculateLayoutDimensions(models.length, !!config.subtitle, !!config.sponsoredBy);
      const scale = containerWidth > 0 ? containerWidth / dimensions.backgroundWidth : 1;
      
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
      if (e instanceof ParseError) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred while generating download");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Panel */}
      <div className="space-y-4">
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
        <div 
          ref={containerRef}
          className="relative border border-gray-300 rounded-lg overflow-hidden"
        >
          {chartHtml && (
            <button
              onClick={downloadHtml}
              className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors z-10"
              title="Download HTML"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {chartHtml ? (
            <div 
              id="chart-preview"
              dangerouslySetInnerHTML={{ __html: chartHtml }} 
            />
          ) : (
            <div className="text-gray-500 p-8 text-center">
              Enter YAML to preview chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
