import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { Element, Sink, Source, Stream } from "./dom.js";

function serializeContent(node) {
  if (typeof node === "string") {
    return node;
  } else if (node instanceof Stream) {
    return `<!--stream=${node.id}-->`;
  } else if (node instanceof Element) {
    const children = node.children.map(serializeContent).join("");
    const attributes = Object.entries(node.attributes)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join("");
    return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

function serializeStreams(node) {
  if (node instanceof Source) {
    const { id, value } = node;
    return { [id]: { value } };
  } else if (node instanceof Sink) {
    const { id, deps, fn } = node;
    return Object.assign(
      { [id]: { deps, fn } },
      ...node.deps.map(serializeStreams)
    );
  } else if (node instanceof Element) {
    return Object.assign({}, ...node.children.map(serializeStreams));
  } else {
    return {};
  }
}

const args = flags.parse(Deno.args);
const inPath = path.normalize(args._[0]);
const outPath = path.normalize(args.out);
const runtimeText = Deno.readTextFileSync("./runtime.js");
await fs.ensureFile(outPath);

let count = 0;
async function build() {
  console.log("building...");
  const app = await import(`./${inPath}?${count}`);
  const dataText = JSON.stringify(serializeStreams(app.default));
  const outputText = await renderFileToString("./template.ejs", {
    head: `<script id="ssg-data" type="application/json">${dataText}</script><script type="module">${runtimeText}</script>`,
    body: `<div id="ssg-content">${serializeContent(app.default)}</div>`,
  });
  await Deno.writeTextFile(outPath, outputText);
  console.log("done");
  count += 1;
}

build();

const watcher = Deno.watchFs(inPath);
for await (const _ of watcher) {
  console.log(_);
  build();
}
