import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { text, question } = await req.json();

		if (!text || text.length < 10) {
			return NextResponse.json(
				{ error: "Document content must be at least 10 characters." },
				{ status: 400 }
			);
		}

		if (!question || question.length < 1) {
			return NextResponse.json(
				{ error: "Question cannot be empty." },
				{ status: 400 }
			);
		}

		// Call Groq API
		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "Missing GROQ_API_KEY env." },
				{ status: 500 }
			);
		}

		const groqRes = await fetch(
			"https://api.groq.com/openai/v1/chat/completions",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					model: "openai/gpt-oss-20b",
					messages: [
						{
							role: "system",
							content: `Bạn là một trợ lý hữu ích. Hãy trả lời câu hỏi dựa trên nội dung document được cung cấp. Nếu thông tin không có trong document, hãy nói rõ điều đó. Trả lời bằng tiếng Việt.

Document content:
${text}`,
						},
						{
							role: "user",
							content: question,
						},
					],
					max_tokens: 1024,
					temperature: 0.7,
				}),
			}
		);

		if (!groqRes.ok) {
			const err = await groqRes.text();
			console.error("Groq API error:", err);
			return NextResponse.json(
				{ error: "Groq API error: " + err },
				{ status: 500 }
			);
		}

		const groqData = await groqRes.json();
		const answer = groqData.choices?.[0]?.message?.content || "";

		return NextResponse.json({ answer });
	} catch (e: any) {
		console.error("QA API error:", e);
		return NextResponse.json(
			{ error: e.message || "Unknown error" },
			{ status: 500 }
		);
	}
}
