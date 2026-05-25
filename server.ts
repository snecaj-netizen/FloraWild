import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as geminiService from "./src/services/geminiService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

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
