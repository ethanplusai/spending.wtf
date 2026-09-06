import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
const bootstrap = document.getElementById("ledger-bootstrap");
const environment = bootstrap
  ? JSON.parse(bootstrap.textContent || "{}")
  : undefined;
const app = (
  <React.StrictMode>
    <App environment={environment} />
  </React.StrictMode>
);
if (bootstrap) ReactDOM.hydrateRoot(document.getElementById("root")!, app);
else ReactDOM.createRoot(document.getElementById("root")!).render(app);
