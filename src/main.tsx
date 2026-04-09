import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

createRoot(document.getElementById("root")!).render(<App />);
  