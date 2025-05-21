import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { UserProvider } from "./contexts/UserContext";
import { Toaster } from "./components/ui/toaster";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index";
import "./styles/globals.css";

// App bileşenini sabit tanımla
const App = () => {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <RouterProvider router={router} />
          <Toaster />
        </UserProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
