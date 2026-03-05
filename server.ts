import express from "express";
import { createServer as createViteServer } from "vite";

// Since we are in a container with Node 22, global fetch is available.
// But to be safe with types, we can just use the global fetch.

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Fish Audio
  app.post("/api/tts", async (req, res) => {
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

      // Stream the response back
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Fish Audio" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving (if needed, but usually handled by build output)
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
