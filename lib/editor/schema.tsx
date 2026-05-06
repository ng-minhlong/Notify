import { BlockNoteSchema, createCodeBlockSpec, defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { codeBlockOptions } from "@blocknote/code-block";
import { SpeechRecorderBlock } from "@/components/editor/SpeechRecorderBlock";
import { createEmbedBlockSpec } from "@/lib/editor/embed";
import { SpeechBlockStatus } from "@/lib/editor/types";

type EditorSchemaOptions = {
  onSpeechBlockUpdate: (
    blockId: string,
    props: Record<string, string>,
  ) => void;
  onGenerateSummary: (blockId: string, transcript: string) => Promise<void>;
};

export const createEditorSchema = ({
  onSpeechBlockUpdate,
  onGenerateSummary,
}: EditorSchemaOptions) => {
  const speechBlock = createReactBlockSpec(
    {
      type: "speech",
      propSchema: {
        textAlignment: defaultProps.textAlignment,
        textColor: defaultProps.textColor,
        transcript: {
          default: "",
        },
        summary: {
          default: "",
        },
        status: {
          default: "idle",
          values: ["idle", "recording", "processing", "completed", "error"],
        },
        errorMessage: {
          default: "",
        },
        durationMs: {
          default: "0",
        },
      },
      content: "none",
    },
    {
      render: (props) => {
        const blockId = props.block.id;
        const transcript = (props.block.props.transcript as string) || "";
        const summary = (props.block.props.summary as string) || "";
        const status =
          ((props.block.props.status as string) || "idle") as SpeechBlockStatus;
        const errorMessage = (props.block.props.errorMessage as string) || "";
        const durationMs = (props.block.props.durationMs as string) || "0";

        return (
          <SpeechRecorderBlock
            blockId={blockId}
            initialTranscript={transcript}
            initialSummary={summary}
            initialStatus={status}
            initialErrorMessage={errorMessage}
            initialDurationMs={durationMs}
            onSpeechBlockUpdate={onSpeechBlockUpdate}
            onGenerateSummary={onGenerateSummary}
          />
        );
      },
    },
  );

  return BlockNoteSchema.create().extend({
    blockSpecs: {
      codeBlock: createCodeBlockSpec({
        ...codeBlockOptions,
        defaultLanguage: "typescript",
        supportedLanguages: {
          typescript: { name: "TypeScript", aliases: ["ts"] },
          javascript: { name: "JavaScript", aliases: ["js"] },
          python: { name: "Python", aliases: ["py"] },
          cpp: { name: "C++", aliases: ["cpp", "c++"] },
          java: { name: "Java" },
          rust: { name: "Rust", aliases: ["rs"] },
          go: { name: "Go" },
          sql: { name: "SQL" },
          html: { name: "HTML" },
          css: { name: "CSS" },
        },
      }),
      embed: createEmbedBlockSpec(),
      speech: speechBlock(),
    },
  });
};
