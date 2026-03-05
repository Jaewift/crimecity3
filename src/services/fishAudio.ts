export async function generateSpeech(text: string, apiKey: string, modelId: string): Promise<ArrayBuffer | null> {
  if (!apiKey || !modelId) {
    console.warn("Fish Audio credentials missing");
    return null;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        apiKey: apiKey,
        modelId: modelId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Fish Audio API Error:", response.status, errorText);
      throw new Error(`Fish Audio API Error: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Failed to generate speech:", error);
    return null;
  }
}
