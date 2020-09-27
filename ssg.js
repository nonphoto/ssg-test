import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { Element, Sink, Source, Stream } from "./dom.js";

function serialize(node) {
  const streamTemplates = collectStreamTemplates(node);
  const contentString = nodeToString(node, streamTemplates);
  const dataString = JSON.stringify({ streamTemplates });
  return [contentString, dataString];
}

function nodeToString(node, streamTemplates) {
  if (typeof node === "string") {
    return node;
  } else if (node instanceof Stream) {
    return `<!--stream=${streamTemplates.indexOf(node)}-->`;
  } else if (node instanceof Element) {
    const children = node.children
      .map((child) => nodeToString(child, streamTemplates))
      .join("");
    const attributes = Object.entries(node.attributes)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join("");
    return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

function collectStreamTemplates(node) {
  if (node instanceof Source) {
    return [node];
  } else if (node instanceof Sink) {
    return [node, ...node.deps.map(collectStreamTemplates).flat()];
  } else if (node instanceof Element) {
    return node.children.map(collectStreamTemplates).flat();
  } else {
    return [];
  }
}

const args = flags.parse(Deno.args);
const inPath = path.normalize(args._[0]);
const outPath = path.normalize(args.out);
await fs.ensureFile(outPath);

let count = 0;
async function build() {
  console.log("building...");
  const app = await import(`./${inPath}?${count}`);
  const [content, data] = serialize(app.default);
  const runtimeText = Deno.readTextFileSync("./runtime.js");
  const outputText = await renderFileToString("./template.ejs", {
    head: `<script id="ssg-data" type="application/json">${data}</script><script type="module">${runtimeText}</script>`,
    body: `<div id="ssg-content">${content}</div>`,
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
