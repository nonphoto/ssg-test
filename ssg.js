import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as flags from "https://deno.land/std/flags/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { SignalTemplate } from "./signal.js";
import { ElementTemplate } from "./element.js";

const toKebabCase = (string) => {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
};

function serialize(node) {
  const signalTemplates = collectSignalTemplates(node);
  const contentString = nodeToString(node, signalTemplates);
  const dataString = JSON.stringify({
    signalTemplates: signalTemplates.map((template) =>
      template.toStub(signalTemplates)
    ),
  });
  return [contentString, dataString];
}

function attributesToString(attributes) {
  return Object.entries(attributes).map(([key, value]) => {
    if (key === "style") {
      const styleString = Object.entries(value)
        .map(
          ([styleKey, styleValue]) =>
            `${toKebabCase(styleKey)}:${styleValue.toString()};`
        )
        .join("");
      return `style="${styleString}"`;
    } else {
      return `${key}="${value}"`;
    }
  });
}

function attributesToSignalIds(node, signalTemplates) {
  if (node instanceof SignalTemplate) {
    return node.getId(signalTemplates);
  } else if (typeof node === "object") {
    const entries = Object.entries(node).reduce((acc, [key, value]) => {
      const newValue = attributesToSignalIds(value, signalTemplates);
      return typeof newValue !== "undefined" ? [...acc, [key, newValue]] : acc;
    }, []);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  } else {
    return;
  }
}

function nodeToString(node, signalTemplates) {
  if (typeof node === "string") {
    return node;
  } else if (node instanceof SignalTemplate) {
    return `<!--signal=${node.getId(signalTemplates)}-->`;
  } else if (node instanceof ElementTemplate) {
    const children = node.children
      .map((child) => nodeToString(child, signalTemplates))
      .join("");
    const attributes = attributesToString(node.attributes);
    const signalIds = attributesToSignalIds(node.attributes, signalTemplates);
    console.log(signalIds);
    const signalAttribute = signalIds
      ? `data-signal-assign='${JSON.stringify(signalIds)}'`
      : "";
    const tag = [node.tagName, ...attributes, signalAttribute].join(" ");
    return `<${tag}>${children}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

function collectSignalTemplates(node) {
  if (node instanceof SignalTemplate) {
    return [node, ...node.args.flatMap(collectSignalTemplates)];
  } else if (node instanceof ElementTemplate) {
    return [
      ...collectSignalTemplates(node.attributes),
      ...node.children.flatMap(collectSignalTemplates),
    ];
  } else if (typeof node === "object") {
    return Object.values(node).flatMap(collectSignalTemplates);
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
  const outputText = await renderFileToString("./template.ejs", {
    head: `<script id="ssg-data" type="application/json">${data}</script><script type="module" src="./runtime.js"></script>`,
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
