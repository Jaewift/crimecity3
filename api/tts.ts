import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, apiKey, modelId } = req.body;

  if (!text || !apiKey || !modelId) {
    return res.status(400).json({ error: "Missing required parameters" });
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
      return res.status(response.status).send(errorText);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: "Failed to fetch from Fish Audio" });
  }
}
