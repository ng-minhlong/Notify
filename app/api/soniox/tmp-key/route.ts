import { NextResponse } from "next/server";
import { SonioxNodeClient } from "@soniox/node";

export async function POST() {
  try {
    const client = new SonioxNodeClient();

    const { api_key } = await client.auth.createTemporaryKey({
      usage_type: "transcribe_websocket",
      expires_in_seconds: 300,
    });

    return NextResponse.json({ api_key });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create temporary key";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}