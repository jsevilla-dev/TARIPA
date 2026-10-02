import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ClientApp from "./ClientApp.jsx";

const path = window.location.pathname;

// Route /client and any /client/* subpath to the ClientApp.
// Everything else goes to the Admin App.
const RootApp =
  path === "/client" || path.startsWith("/client/")
    ? ClientApp
    : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);