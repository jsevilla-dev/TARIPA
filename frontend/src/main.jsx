import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./index.css";
import App from "./App.jsx";
import ClientApp from "./ClientApp.jsx";
import { ToastProvider } from "./components/Toast.jsx";

// Initialize Lenis smooth inertial scrolling globally
const lenis = new Lenis({
  autoRaf: true,
  duration: 1.1,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});
window.__lenis = lenis;

const path = window.location.pathname;

// Route /client and any /client/* subpath to the ClientApp.
// Everything else goes to the Admin App.
const RootApp =
  path === "/client" || path.startsWith("/client/")
    ? ClientApp
    : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider>
      <RootApp />
    </ToastProvider>
  </StrictMode>
);