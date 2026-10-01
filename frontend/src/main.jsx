import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ClientApp from "./ClientApp.jsx";

const path = window.location.pathname;

const RootApp =
  path === "/client" || path === "/client/login"
    ? ClientApp
    : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);