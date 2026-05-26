import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as geminiService from "./src/services/geminiService";
import { Agent, setGlobalDispatcher } from "undici";

// Configure Node's built-in global fetch dispatcher to increase timeouts and bypass HeadersTimeoutError
setGlobalDispatcher(new Agent({
  headersTimeout: 60000, // 1 minute timeout for wait-on-headers to accommodate complex responses
  bodyTimeout: 60000,    // 1 minute timeout for response stream body chunks
  connectTimeout: 30000   // 30 seconds timeout for sockets connection establishment
}));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Prevent sw.js caching so service worker updates are instant in PWA
  app.get("/sw.js", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    next();
  });

  // API routes
  app.post("/api/identify", async (req, res) => {
    try {
      const { base64Image, category, subjectPart, feedback } = req.body;
      const result = await geminiService.identifyPlant(base64Image, category, subjectPart, feedback);
      res.json(result);
    } catch (error: any) {
      console.error("Error identifying plant:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { queryText, category, activeCategory } = req.body;
      const result = await geminiService.searchPlant(queryText, category, activeCategory);
      res.json(result);
    } catch (error: any) {
      console.error("Error searching plant:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
