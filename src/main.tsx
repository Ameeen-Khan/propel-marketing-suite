import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAuth } from "./services/api";

// Initialize auth token from localStorage
initializeAuth();

createRoot(document.getElementById("root")!).render(<App />);
