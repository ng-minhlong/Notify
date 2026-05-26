import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core/extensions";
import {
  DefaultReactSuggestionItem,
} from "@blocknote/react";
import { getAISlashMenuItems } from "@blocknote/xl-ai";
import { EmbedProvider, EditorInstance } from "@/lib/editor/types";
import { ChartType, getDefaultChartProps } from "@/components/editor/ChartBlock";
import Image from "next/image";
import { AudioWaveform, BarChart2, LineChart, PieChart, AreaChart, ScatterChart, Radar } from 'lucide-react';

export const insertSpeechBlock = (editor: EditorInstance) => {
  const speechBlockId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `speech-${Date.now()}`;

  insertOrUpdateBlockForSlashMenu(editor, {
    id: speechBlockId,
    type: "speech",
    props: {
      transcript: "",
      summary: "",
      status: "idle",
      errorMessage: "",
      durationMs: "0",
    },
  });
};

const insertChartBlock = (editor: EditorInstance, chartType: ChartType) => {
  const defaults = getDefaultChartProps(chartType);
  const blockId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `chart-${Date.now()}`;

  insertOrUpdateBlockForSlashMenu(editor, {
    id: blockId,
    type: "chart",
    props: {
      chartType: defaults.chartType,
      title: defaults.title,
      dataJson: defaults.dataJson,
      xKey: defaults.xKey,
      seriesKeys: defaults.seriesKeys,
    },
  });
};

export const getCustomSlashMenuItems = (
  editor: EditorInstance,
  openEmbedModal: (provider: EmbedProvider) => void,
): DefaultReactSuggestionItem[] => {
  const chartItems: DefaultReactSuggestionItem[] = [
    {
      title: "Line Chart",
      subtext: "Biểu đồ đường thể hiện xu hướng theo thời gian",
      group: "Charts",
      aliases: ["chart", "line", "linechart", "trend"],
      onItemClick: () => insertChartBlock(editor, "line"),
      icon: <LineChart className="h-[18px] w-[18px]" />,
    },
    {
      title: "Bar Chart",
      subtext: "Biểu đồ cột so sánh các giá trị",
      group: "Charts",
      aliases: ["chart", "bar", "barchart", "column"],
      onItemClick: () => insertChartBlock(editor, "bar"),
      icon: <BarChart2 className="h-[18px] w-[18px]" />,
    },
    {
      title: "Area Chart",
      subtext: "Biểu đồ vùng thể hiện khối lượng theo thời gian",
      group: "Charts",
      aliases: ["chart", "area", "areachart"],
      onItemClick: () => insertChartBlock(editor, "area"),
      icon: <AreaChart className="h-[18px] w-[18px]" />,
    },
    {
      title: "Pie Chart",
      subtext: "Biểu đồ tròn thể hiện tỷ lệ phần trăm",
      group: "Charts",
      aliases: ["chart", "pie", "piechart", "donut"],
      onItemClick: () => insertChartBlock(editor, "pie"),
      icon: <PieChart className="h-[18px] w-[18px]" />,
    },
    {
      title: "Scatter Chart",
      subtext: "Biểu đồ phân tán thể hiện tương quan giữa hai biến",
      group: "Charts",
      aliases: ["chart", "scatter", "scatterchart", "dot"],
      onItemClick: () => insertChartBlock(editor, "scatter"),
      icon: <ScatterChart className="h-[18px] w-[18px]" />,
    },
    {
      title: "Composed Chart",
      subtext: "Kết hợp nhiều loại biểu đồ (bar + line)",
      group: "Charts",
      aliases: ["chart", "composed", "composedchart", "mixed", "combo"],
      onItemClick: () => insertChartBlock(editor, "composed"),
      icon: <BarChart2 className="h-[18px] w-[18px]" />,
    },
    {
      title: "Radar Chart",
      subtext: "Biểu đồ radar thể hiện nhiều chiều dữ liệu",
      group: "Charts",
      aliases: ["chart", "radar", "radarchart", "spider", "web"],
      onItemClick: () => insertChartBlock(editor, "radar"),
      icon: <Radar className="h-[18px] w-[18px]" />,
    },
  ];

  const speechItems: DefaultReactSuggestionItem[] = [
    {
      title: "Speech to Text",
      subtext: "Record giọng nói và tự chèn transcript",
      group: "Input",
      aliases: ["speech", "voice", "record", "audio", "transcribe", "dictation"],
      onItemClick: () => insertSpeechBlock(editor),
      icon: <AudioWaveform />,
    },
  ];

  const embedItems: DefaultReactSuggestionItem[] = [
    {
      title: "YouTube",
      subtext: "Insert video YouTube",
      group: "Embeds",
      aliases: ["youtube", "video", "embed"],
      onItemClick: () => openEmbedModal("youtube"),
      icon: <Image src="/third-party-logo/youtube.svg" alt="YouTube" width={18} height={18} />,
    },
    {
      title: "Google Drive",
      subtext: "Insert file hoặc document from Drive",
      group: "Embeds",
      aliases: ["drive", "google drive", "embed"],
      onItemClick: () => openEmbedModal("drive"),
      icon: <Image src="/third-party-logo/drive.svg" alt="Google Drive" width={18} height={18} />,
    },
    {
      title: "Figma",
      subtext: "Insert file Figma",
      group: "Embeds",
      aliases: ["figma", "design", "embed"],
      onItemClick: () => openEmbedModal("figma"),
      icon: <Image src="/third-party-logo/figma.svg" alt="Figma" width={18} height={18} />,
    },
  ];

  return [...chartItems, ...speechItems, ...embedItems, ...getAISlashMenuItems(editor as any)];
};
