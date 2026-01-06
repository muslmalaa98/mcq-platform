import "./styles.css";
import { initTheme } from "./storage.js";
import { mountApp } from "./router.js";

initTheme();
mountApp(document.querySelector("#app"));
