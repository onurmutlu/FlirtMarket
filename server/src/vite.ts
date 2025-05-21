import express, { type Express } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";

export const log = (...args: any[]) => {
  console.log("[express]", ...args);
};

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server
      }
    },
    appType: "spa",
    root: path.resolve(process.cwd(), "../client")
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Always read fresh template in development
      let template = await vite.transformIndexHtml(url, "");
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const clientDist = path.resolve(process.cwd(), "../client/dist");
  
  app.use(express.static(clientDist));
  
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
