import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { StreamTemplate } from "./stream.js";
import { ElementTemplate } from "./element.js";

function getPath(pathArray, object) {
  let v = object;
  let i = 0;
  let p;
  while (i < pathArray.length) {
    if (v == null) {
      return;
    }
    p = pathArray[i];
    v = v[p];
    i += 1;
  }
  return v;
}

function collectPaths(object) {
  if (object instanceof StreamTemplate) {
    return [[]];
  } else if (Array.isArray(object)) {
    return object.reduce(
      (acc, v, k) => [...acc, ...collectPaths(v).map((p) => [k, ...p])],
      []
    );
  } else if (typeof object === "object") {
    return [].concat(
      ...Object.entries(object).map(([k, v]) =>
        collectPaths(v).map((p) => [k, ...p])
      )
    );
  } else {
    return [[]];
  }
}

function serialize(node) {
  const streamTemplates = collectStreamTemplates(node);
  const contentString = nodeToString(node, streamTemplates);
  const dataString = JSON.stringify({
    streamTemplates: streamTemplates.map((template) =>
      template.toObject(streamTemplates)
    ),
  });
  return [contentString, dataString];
}

function nodeToString(node, streamTemplates) {
  if (typeof node === "string") {
    return node;
  } else if (node instanceof StreamTemplate) {
    return `<!--stream=${node.getId(streamTemplates)}-->`;
  } else if (node instanceof ElementTemplate) {
    const children = node.children
      .map((child) => nodeToString(child, streamTemplates))
      .join("");
    const attributes = collectPaths(node.attributes)
      .map((p) => ` ${p.join(".")}="${getPath(p, node.attributes)}"`)
      .join("");
    return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

function collectStreamTemplates(node) {
  if (node instanceof StreamTemplate) {
    return [node, ...node.deps.map(collectStreamTemplates).flat()];
  } else if (node instanceof ElementTemplate) {
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
