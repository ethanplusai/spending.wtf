import { renameSync } from "node:fs";
// Keep the HTML shell private so '/' always receives server-rendered HTML.
renameSync("dist/index.html", "dist/server/page-template.html");
