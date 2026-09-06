import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

test("SSR deployment bundle imports and renders without workspace node_modules", async () => {
  const directory = await mkdtemp(
    path.join(tmpdir(), "spending-ssr-artifact-"),
  );
  try {
    const bundle = path.join(directory, "renderer.mjs");
    await copyFile(
      new URL("../dist/server/entry-server.js", import.meta.url),
      bundle,
    );
    for (const name of ["normalized", "debt"]) {
      await copyFile(
        new URL(`../dist/data/${name}.json`, import.meta.url),
        path.join(directory, name + ".json"),
      );
    }
    const { stdout } = await exec(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      import { render } from ${JSON.stringify(new URL("file://" + bundle).href)};
      const fs = await import('node:fs');
      const snapshots = Object.fromEntries(['normalized', 'debt'].map(name => [name, JSON.parse(fs.readFileSync(name + '.json', 'utf8'))]));
      const html = render({ url: '/sources', snapshots });
      if (!html.includes('<h1')) throw Error('SSR did not render a page heading');
      console.log('isolated SSR rendering passed');
    `,
      ],
      { cwd: directory, env: { ...process.env, NODE_PATH: "" } },
    );
    assert.match(stdout, /isolated SSR rendering passed/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
