import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { UserProvider } from "./contexts/UserContext";
import { initializeTelegramWebApp } from "./lib/telegram";

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
