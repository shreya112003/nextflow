// src/lib/gemini.ts
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export const SUPPORTED_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-pro",
] as const;

export type GeminiModel = (typeof SUPPORTED_MODELS)[number];

interface RunLLMOptions {
  model: GeminiModel;
  systemPrompt?: string;
  userMessage: string;
  imageUrls?: string[]; // base64 or public URLs fetched server-side
}

export async function runGemini(options: RunLLMOptions): Promise<string> {
  const { model, systemPrompt, userMessage, imageUrls = [] } = options;

  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt || undefined,
  });

  const parts: Part[] = [];

  // Attach images if provided
  for (const url of imageUrls) {
    if (url.startsWith("data:")) {
      const [meta, base64] = url.split(",");
      const mimeType = meta.replace("data:", "").replace(";base64", "") as
        | "image/jpeg"
        | "image/png"
        | "image/webp";
      parts.push({ inlineData: { data: base64, mimeType } });
    } else {
      // Fetch remote image and convert to base64
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const base64 = Buffer.from(buf).toString("base64");
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        parts.push({ inlineData: { data: base64, mimeType: ct as "image/jpeg" } });
      } catch {
        // skip if image fetch fails
      }
    }
  }

  parts.push({ text: userMessage });

  const result = await geminiModel.generateContent({ contents: [{ role: "user", parts }] });
  return result.response.text();
}
