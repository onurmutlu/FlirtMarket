import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import { UserProvider } from "./contexts/UserContext";
import { initializeTelegramWebApp } from "./lib/telegram";

// Import styles
import "virtual:uno.css";
import "./styles/globals.css";
import "./index.css";

// Initialize Telegram Web App
initializeTelegramWebApp();

// Create a debug function to check state
window.debugApp = {
  telegramWebApp: window.Telegram?.WebApp,
  queryClient,
};

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <App />
    </UserProvider>
  </QueryClientProvider>
);
