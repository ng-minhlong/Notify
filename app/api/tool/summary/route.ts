
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { text, prompt } = await req.json();
		if (!text || text.length < 50) {
			return NextResponse.json({ error: "Text must be at least 50 characters." }, { status: 400 });
		}

		// Call Groq API (replace with your Groq API key)
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			return NextResponse.json({ error: "Missing GROQ_API_KEY env." }, { status: 500 });
		}

		const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: "openai/gpt-oss-20b",
				messages: [
					{ role: "system", content: prompt || "Tóm tắt nội dung sau bằng tiếng Việt, ngắn gọn, súc tích, dễ hiểu cho người mới bắt đầu:" },
					{ role: "user", content: text },
				],
				max_tokens: 512,
				temperature: 0.7,
			}),
		});

		if (!groqRes.ok) {
			const err = await groqRes.text();
			return NextResponse.json({ error: "Groq API error: " + err }, { status: 500 });
		}
		const groqData = await groqRes.json();
		const summary = groqData.choices?.[0]?.message?.content || "";
		return NextResponse.json({ summary });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
	}
}
