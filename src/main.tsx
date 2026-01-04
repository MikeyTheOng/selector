import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { initializeTextScale } from "./hooks/use-text-scale";
import { TextScaleProvider } from "./providers/TextScaleProvider";

initializeTextScale();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TextScaleProvider>
      <App />
    </TextScaleProvider>
  </React.StrictMode>,
);
