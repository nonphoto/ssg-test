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

function attributesToString(attributes, signalTemplates) {
  return Object.entries(attributes)
    .map(([key, value]) => {
      if (key === "style") {
        const entries = Object.entries(value);
        const styleString = entries
          .filter(([, styleValue]) => !(styleValue instanceof SignalTemplate))
          .map(([styleKey, styleValue]) =>
            typeof styleValue === "string"
              ? `${toKebabCase(styleKey)}:${styleValue};`
              : ""
          )
          .join("");
        const signalString = entries
          .filter(([, styleValue]) => styleValue instanceof SignalTemplate)
          .map(
            ([styleKey, styleValue]) =>
              `bind-style:${toKebabCase(styleKey)}="${styleValue.getId(
                signalTemplates
              )}"`
          )
          .join(" ");
        return `style="${styleString}" ${signalString}`;
      }
    })
    .join(" ");
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
    const attributes = attributesToString(node.attributes, signalTemplates);
    return `<${node.tagName} ${attributes}>${children}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

function collectSignalTemplates(node) {
  if (node instanceof SignalTemplate) {
    return [node, ...node.args.map(collectSignalTemplates).flat()];
  } else if (node instanceof ElementTemplate) {
    return node.children.map(collectSignalTemplates).flat();
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
