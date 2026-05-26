"use client";

import { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartType =
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "scatter"
  | "composed"
  | "radar";

export type ChartBlockProps = {
  chartType: ChartType;
  title: string;
  /** JSON string of the data array */
  dataJson: string;
  /** Comma-separated list of data keys to plot (for cartesian charts) */
  seriesKeys: string;
  /** The key used for the X-axis / category axis */
  xKey: string;
  onUpdate: (props: Partial<ChartBlockStoredProps>) => void;
};

export type ChartBlockStoredProps = {
  chartType: ChartType;
  title: string;
  dataJson: string;
  seriesKeys: string;
  xKey: string;
};

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

// ─── Default data per chart type ─────────────────────────────────────────────

const DEFAULT_DATA: Record<ChartType, { data: object[]; xKey: string; seriesKeys: string }> = {
  line: {
    data: [
      { month: "Jan", value: 400 },
      { month: "Feb", value: 300 },
      { month: "Mar", value: 600 },
      { month: "Apr", value: 800 },
      { month: "May", value: 500 },
    ],
    xKey: "month",
    seriesKeys: "value",
  },
  bar: {
    data: [
      { month: "Jan", sales: 400, profit: 240 },
      { month: "Feb", sales: 300, profit: 139 },
      { month: "Mar", sales: 600, profit: 380 },
      { month: "Apr", sales: 800, profit: 430 },
      { month: "May", sales: 500, profit: 210 },
    ],
    xKey: "month",
    seriesKeys: "sales,profit",
  },
  area: {
    data: [
      { month: "Jan", value: 400 },
      { month: "Feb", value: 300 },
      { month: "Mar", value: 600 },
      { month: "Apr", value: 800 },
      { month: "May", value: 500 },
    ],
    xKey: "month",
    seriesKeys: "value",
  },
  pie: {
    data: [
      { name: "Group A", value: 400 },
      { name: "Group B", value: 300 },
      { name: "Group C", value: 300 },
      { name: "Group D", value: 200 },
    ],
    xKey: "name",
    seriesKeys: "value",
  },
  scatter: {
    data: [
      { x: 100, y: 200 },
      { x: 120, y: 100 },
      { x: 170, y: 300 },
      { x: 140, y: 250 },
      { x: 150, y: 400 },
      { x: 110, y: 280 },
    ],
    xKey: "x",
    seriesKeys: "y",
  },
  composed: {
    data: [
      { month: "Jan", bar: 400, line: 240 },
      { month: "Feb", bar: 300, line: 139 },
      { month: "Mar", bar: 600, line: 380 },
      { month: "Apr", bar: 800, line: 430 },
      { month: "May", bar: 500, line: 210 },
    ],
    xKey: "month",
    seriesKeys: "bar,line",
  },
  radar: {
    data: [
      { subject: "Math", A: 120, B: 110 },
      { subject: "English", A: 98, B: 130 },
      { subject: "Physics", A: 86, B: 130 },
      { subject: "History", A: 99, B: 100 },
      { subject: "Geography", A: 85, B: 90 },
    ],
    xKey: "subject",
    seriesKeys: "A,B",
  },
};

// ─── Chart renderer ───────────────────────────────────────────────────────────

function renderChart(
  chartType: ChartType,
  data: object[],
  xKey: string,
  seriesKeys: string[],
) {
  const containerProps = { width: "100%" as const, height: 300 };

  switch (chartType) {
    case "line":
      return (
        <ResponsiveContainer {...containerProps}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "bar":
      return (
        <ResponsiveContainer {...containerProps}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer {...containerProps}>
          <AreaChart data={data}>
            <defs>
              {seriesKeys.map((key, i) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                fill={`url(#grad-${key})`}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie": {
      const valueKey = seriesKeys[0] ?? "value";
      return (
        <ResponsiveContainer {...containerProps}>
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "scatter": {
      const yKey = seriesKeys[0] ?? "y";
      return (
        <ResponsiveContainer {...containerProps}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={xKey} name={xKey} tick={{ fontSize: 12 }} />
            <YAxis dataKey={yKey} name={yKey} tick={{ fontSize: 12 }} />
            <ZAxis range={[60, 60]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            <Scatter name="Data" data={data} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    case "composed":
      return (
        <ResponsiveContainer {...containerProps}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) =>
              i === 0 ? (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ) : (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );

    case "radar":
      return (
        <ResponsiveContainer {...containerProps}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {seriesKeys.map((key, i) => (
              <Radar
                key={key}
                name={key}
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.25}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}

// ─── Data editor ─────────────────────────────────────────────────────────────

type DataEditorProps = {
  dataJson: string;
  xKey: string;
  seriesKeys: string;
  onApply: (dataJson: string, xKey: string, seriesKeys: string) => void;
};

function DataEditor({ dataJson, xKey, seriesKeys, onApply }: DataEditorProps) {
  const [localData, setLocalData] = useState(dataJson);
  const [localXKey, setLocalXKey] = useState(xKey);
  const [localSeriesKeys, setLocalSeriesKeys] = useState(seriesKeys);
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(localData);
      if (!Array.isArray(parsed)) throw new Error("Data phải là một mảng JSON.");
      setError(null);
      onApply(localData, localXKey, localSeriesKeys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "JSON không hợp lệ.");
    }
  };

  return (
    <div className="space-y-3 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            X-axis key
          </label>
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={localXKey}
            onChange={(e) => setLocalXKey(e.target.value)}
            placeholder="e.g. month"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Series keys (comma-separated)
          </label>
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={localSeriesKeys}
            onChange={(e) => setLocalSeriesKeys(e.target.value)}
            placeholder="e.g. sales,profit"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Data (JSON array)
        </label>
        <textarea
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          rows={6}
          value={localData}
          onChange={(e) => {
            setLocalData(e.target.value);
            setError(null);
          }}
          spellCheck={false}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleApply}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Apply &amp; Render
      </button>
    </div>
  );
}

// ─── Chart type label ─────────────────────────────────────────────────────────

const CHART_LABELS: Record<ChartType, string> = {
  line: "Line Chart",
  bar: "Bar Chart",
  area: "Area Chart",
  pie: "Pie Chart",
  scatter: "Scatter Chart",
  composed: "Composed Chart",
  radar: "Radar Chart",
};

// ─── Main block component ─────────────────────────────────────────────────────

export function ChartBlock({
  chartType,
  title,
  dataJson,
  seriesKeys,
  xKey,
  onUpdate,
}: ChartBlockProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  // Parse data safely
  const data = useCallback(() => {
    try {
      const parsed = JSON.parse(dataJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [dataJson])();

  const keys = seriesKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const handleApply = (
    newDataJson: string,
    newXKey: string,
    newSeriesKeys: string,
  ) => {
    onUpdate({ dataJson: newDataJson, xKey: newXKey, seriesKeys: newSeriesKeys });
  };

  return (
    <div
      className="my-3 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900"
      contentEditable={false}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {title || CHART_LABELS[chartType]}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {CHART_LABELS[chartType]} · {data.length} data points
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditorOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          {editorOpen ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide editor
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Edit data
            </>
          )}
        </button>
      </div>

      {/* Chart */}
      <div className="px-4 py-5">
        {data.length > 0 ? (
          renderChart(chartType, data, xKey, keys)
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
            Không có dữ liệu. Mở editor để nhập data.
          </div>
        )}
      </div>

      {/* Inline data editor */}
      {editorOpen && (
        <DataEditor
          dataJson={dataJson}
          xKey={xKey}
          seriesKeys={seriesKeys}
          onApply={handleApply}
        />
      )}
    </div>
  );
}

// ─── Exported helper ──────────────────────────────────────────────────────────

export function getDefaultChartProps(chartType: ChartType): ChartBlockStoredProps {
  const defaults = DEFAULT_DATA[chartType];
  return {
    chartType,
    title: CHART_LABELS[chartType],
    dataJson: JSON.stringify(defaults.data, null, 2),
    xKey: defaults.xKey,
    seriesKeys: defaults.seriesKeys,
  };
}
