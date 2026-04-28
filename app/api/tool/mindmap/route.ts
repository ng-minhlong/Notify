import { NextRequest, NextResponse } from "next/server";

function extractJsonContent(input: string) {
	let content = (input || "").trim();

	// Remove markdown fences if present
	const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenceMatch?.[1]) {
		content = fenceMatch[1].trim();
	}

	// If model still adds extra text, try to slice from first { to last }
	const firstBrace = content.indexOf("{");
	const lastBrace = content.lastIndexOf("}");
	if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
		content = content.slice(firstBrace, lastBrace + 1).trim();
	}

	return content;
}

async function repairJsonWithGroq(apiKey: string, brokenJson: string) {
	const repairRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
					content:
						"Bạn là bộ sửa JSON. Chỉ trả về JSON hợp lệ, không giải thích, không markdown, không code block. Sửa nội dung lỗi thành JSON hợp lệ nếu có thể.",
				},
				{
					role: "user",
					content: brokenJson,
				},
			],
			max_tokens: 1500,
			temperature: 0,
		}),
	});

	if (!repairRes.ok) {
		const err = await repairRes.text();
		throw new Error("Groq repair API error: " + err);
	}

	const repairData = await repairRes.json();
	const repairedText = repairData.choices?.[0]?.message?.content || "";
	return extractJsonContent(repairedText);
}

export async function POST(req: NextRequest) {
	try {
		const { text } = await req.json();

		if (!text || text.length < 50) {
			return NextResponse.json(
				{ error: "Text must be at least 50 characters." },
				{ status: 400 }
			);
		}

		const apiKey = process.env.GROQ_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "Missing GROQ_API_KEY env." },
				{ status: 500 }
			);
		}

		const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
						content:
							'Trả về CHỈ JSON hợp lệ, không thêm text khác, không dùng markdown, không dùng ```.\nTạo mindmap dạng JSON với cấu trúc:\n{\n  "id": string,\n  "label": string,\n  "children": [\n    { "id": string, "label": string, "children"?: [...] }\n  ]\n}\nDùng tiếng Việt, ngắn gọn, tối đa 3 cấp độ.\nNếu không thể hoàn thành đầy đủ thì vẫn cố trả về JSON hợp lệ.',
					},
					{ role: "user", content: text },
				],
				max_tokens: 1500,
				temperature: 0.2,
			}),
		});

		if (!groqRes.ok) {
			const err = await groqRes.text();
			return NextResponse.json({ error: "Groq API error: " + err }, { status: 500 });
		}

		const groqData = await groqRes.json();
		const rawContent = groqData.choices?.[0]?.message?.content || "";
		let mindmapContent = extractJsonContent(rawContent);

		// Parse thử lần 1
		try {
			const parsed = JSON.parse(mindmapContent);
			return NextResponse.json({ mindmap: parsed });
		} catch {
			// Repair lần 2 nếu JSON bị gãy / dính markdown / bị cắt
			try {
				mindmapContent = await repairJsonWithGroq(apiKey, mindmapContent);
				const repairedParsed = JSON.parse(mindmapContent);
				return NextResponse.json({ mindmap: repairedParsed });
			} catch {
				return NextResponse.json(
					{
						error: "Invalid JSON response from API",
						raw: rawContent,
						extracted: mindmapContent,
					},
					{ status: 500 }
				);
			}
		}
	} catch (e: any) {
		return NextResponse.json(
			{ error: e?.message || "Unknown error" },
			{ status: 500 }
		);
	}
}