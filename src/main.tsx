import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Lottery from "./components/Lottery.tsx";

document.documentElement.classList.add("dark");

const isLottery = window.location.pathname.replace(/\/+$/, "") === "/lottery";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isLottery ? <Lottery /> : <App />}</StrictMode>,
);
