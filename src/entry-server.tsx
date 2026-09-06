import { renderToString } from "react-dom/server";
import App from "./App";
import type { Environment } from "./environment";
export { pageInfo } from "./seo";
export { routes } from "./routes";
export function render(environment: Environment) {
  return renderToString(<App environment={environment} />);
}
