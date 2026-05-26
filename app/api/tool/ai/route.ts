import { createGroq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  jsonSchema,
  streamText,
  tool,
  type JSONSchema7,
  type ToolSet,
  type UIMessage,
} from "ai";

export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.1-8b-instant: 20000 TPM on Groq free tier — enough for BlockNote document state
const AI_MODEL = "openai/gpt-oss-20b";

// System prompt from @blocknote/xl-ai htmlBlockLLMFormat.systemPrompt
const SYSTEM_PROMPT = `You're manipulating a text document using HTML blocks. 
Make sure to follow the json schema provided. When referencing ids they MUST be EXACTLY the same (including the trailing $). 
List items are 1 block with 1 list item each, so block content \`<ul><li>item1</li></ul>\` is valid, but \`<ul><li>item1</li><li>item2</li></ul>\` is invalid. We'll merge them automatically.
For code blocks, you can use the \`data-language\` attribute on a <code> block (wrapped with <pre>) to specify the language.

If the user requests updates to the document, use the "applyDocumentOperations" tool to update the document.
---
IF there is no selection active in the latest state, first, determine what part of the document the user is talking about. You SHOULD probably take cursor info into account if needed.
  EXAMPLE: if user says "below" (without pointing to a specific part of the document) he / she probably indicates the block(s) after the cursor. 
  EXAMPLE: If you want to insert content AT the cursor position (UNLESS indicated otherwise by the user), then you need \`referenceId\` to point to the block before the cursor with position \`after\` (or block below and \`before\`
---
 `;

// Inlined from @blocknote/xl-ai — injectDocumentStateMessages
// Injects document state from message metadata as assistant context messages.
// OPTIMIZATION: Only inject document state for the LAST user message to avoid
// sending the full document JSON multiple times (each message carries its own
// document state snapshot, which blows up the token count fast).
function injectDocumentStateMessages(messages: UIMessage[]): UIMessage[] {
  // Find index of the last user message that has documentState
  let lastDocStateIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && (messages[i].metadata as any)?.documentState) {
      lastDocStateIdx = i;
      break;
    }
  }

  return messages.flatMap((message, idx) => {
    // Strip documentState from all user messages except the last one
    if (message.role === "user" && (message.metadata as any)?.documentState) {
      if (idx !== lastDocStateIdx) {
        // Return message without injecting document state context
        return [message];
      }

      const documentState = (message.metadata as any).documentState as any;
      return [
        {
          role: "assistant" as const,
          id: "assistant-document-state-" + message.id,
          parts: documentState.selection
            ? [
                {
                  type: "text" as const,
                  text: `This is the latest state of the selection (ignore previous selections, you MUST issue operations against this latest version of the selection):`,
                },
                {
                  type: "text" as const,
                  text: JSON.stringify(documentState.selectedBlocks),
                },
                {
                  type: "text" as const,
                  text: `This is the latest state of the entire document (INCLUDING the selected text), you can use this to find the selected text to understand the context (but you MUST NOT issue operations against this document, you MUST issue operations against the selection):`,
                },
                {
                  type: "text" as const,
                  text: JSON.stringify(documentState.blocks),
                },
              ]
            : [
                {
                  type: "text" as const,
                  text:
                    `There is no active selection. This is the latest state of the document (ignore previous documents, you MUST issue operations against this latest version of the document). The cursor is BETWEEN two blocks as indicated by cursor: true.\n` +
                    (documentState.isEmptyDocument
                      ? `Because the document is empty, YOU MUST first update the empty block before adding new blocks.`
                      : "Prefer updating existing blocks over removing and adding (but this also depends on the user's question)."),
                },
                {
                  type: "text" as const,
                  text: JSON.stringify(documentState.blocks),
                },
              ],
        },
        message,
      ];
    }
    return [message];
  });
}

// Inlined from @blocknote/xl-ai — toolDefinitionsToToolSet
// Converts serializable tool definitions (sent from client) into AI SDK ToolSet.
type ToolDefinition = {
  description?: string;
  inputSchema: JSONSchema7;
  outputSchema: JSONSchema7;
};

function toolDefinitionsToToolSet(
  toolDefinitions: Record<string, ToolDefinition>,
): ToolSet {
  return Object.fromEntries(
    Object.entries(toolDefinitions).map(([name, definition]) => [
      name,
      tool({
        ...definition,
        inputSchema: jsonSchema(definition.inputSchema),
        outputSchema: jsonSchema(definition.outputSchema),
      }),
    ]),
  );
}

export async function POST(req: Request) {
  const { messages, toolDefinitions } = await req.json();

  const result = streamText({
    model: groq(AI_MODEL),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(injectDocumentStateMessages(messages)),
    tools: toolDefinitionsToToolSet(toolDefinitions),
    toolChoice: "required",
    maxOutputTokens: 2048,
  });

  return result.toUIMessageStreamResponse();
}
