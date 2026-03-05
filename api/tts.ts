import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, apiKey, modelId } = await req.json();

  if (!text || !apiKey || !modelId) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        reference_id: modelId,
        format: "mp3",
        mp3_bitrate: 128,
        latency: "normal"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fish Audio API Error:", response.status, errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch from Fish Audio" }, { status: 500 });
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
