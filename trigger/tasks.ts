// trigger/tasks.ts
// All node executions MUST go through Trigger.dev tasks (per spec)

import { task, logger } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── LLM Task ────────────────────────────────────────────────────────────────

export const llmTask = task({
  id: "llm-node",
  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    imageUrls?: string[];
  }) => {
    logger.info("Running LLM node", { model: payload.model });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const geminiModel = genAI.getGenerativeModel({
      model: payload.model,
      systemInstruction: payload.systemPrompt || undefined,
    });

    const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [];

    for (const url of payload.imageUrls ?? []) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const base64 = Buffer.from(buf).toString("base64");
        const mimeType = res.headers.get("content-type") ?? "image/jpeg";
        parts.push({ inlineData: { data: base64, mimeType } });
      } catch (e) {
        logger.warn("Failed to fetch image for LLM", { url, error: String(e) });
      }
    }

    parts.push({ text: payload.userMessage });

    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts }],
    });

    const text = result.response.text();
    logger.info("LLM completed", { chars: text.length });
    return { output: text };
  },
});

// ── Crop Image Task (FFmpeg) ─────────────────────────────────────────────────

export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: {
    imageUrl: string;
    x: number;     // percent 0-100
    y: number;
    width: number;
    height: number;
    transloaditKey: string;
    transloaditSecret: string;
  }) => {
    logger.info("Running crop image task", payload);

    const { imageUrl, x, y, width, height, transloaditKey } = payload;

    // Transloadit assembly for FFmpeg crop
    const assemblyInstructions = {
      steps: {
        import: {
          robot: "/http/import",
          url: imageUrl,
        },
        crop: {
          robot: "/image/resize",
          use: "import",
          // crop as percentages → compute in pixels is done by transloadit
          crop: {
            x1: `${x}%`,
            y1: `${y}%`,
            x2: `${x + width}%`,
            y2: `${y + height}%`,
          },
          result: true,
        },
      },
    };

    const formData = new FormData();
    formData.append("params", JSON.stringify({ auth: { key: transloaditKey }, ...assemblyInstructions }));

    const res = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.ok !== "ASSEMBLY_COMPLETED") {
      throw new Error(`Transloadit assembly failed: ${data.error ?? data.message}`);
    }

    const resultUrl = data.results?.crop?.[0]?.ssl_url ?? data.results?.crop?.[0]?.url;
    if (!resultUrl) throw new Error("No result URL from Transloadit crop");

    logger.info("Crop complete", { resultUrl });
    return { output: resultUrl };
  },
});

// ── Extract Frame Task (FFmpeg) ───────────────────────────────────────────────

export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: {
    videoUrl: string;
    timestamp: string; // "50%" or "10" (seconds)
    transloaditKey: string;
    transloaditSecret: string;
  }) => {
    logger.info("Running extract frame task", payload);

    const { videoUrl, timestamp, transloaditKey } = payload;

    // Convert "50%" to offset param
    const isPercent = String(timestamp).endsWith("%");
    const offsetParam = isPercent
      ? { ffmpeg_stack: "v5.0.0", offset_percent: parseFloat(timestamp) }
      : { ffmpeg_stack: "v5.0.0", offset_seconds: parseFloat(timestamp) };

    const assemblyInstructions = {
      steps: {
        import: {
          robot: "/http/import",
          url: videoUrl,
        },
        frame: {
          robot: "/video/thumbs",
          use: "import",
          count: 1,
          ...offsetParam,
          result: true,
        },
      },
    };

    const formData = new FormData();
    formData.append(
      "params",
      JSON.stringify({ auth: { key: transloaditKey }, ...assemblyInstructions })
    );

    const res = await fetch("https://api2.transloadit.com/assemblies", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.ok !== "ASSEMBLY_COMPLETED") {
      throw new Error(`Transloadit assembly failed: ${data.error ?? data.message}`);
    }

    const resultUrl = data.results?.frame?.[0]?.ssl_url ?? data.results?.frame?.[0]?.url;
    if (!resultUrl) throw new Error("No result URL from Transloadit frame extraction");

    logger.info("Frame extraction complete", { resultUrl });
    return { output: resultUrl };
  },
});
