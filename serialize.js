import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import app from "./app.js";
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

const dataText = JSON.stringify(serializeStreams(app));
const deserializeText = Deno.readTextFileSync("./deserialize.js");
const outputText = await renderFileToString("index.ejs", {
  head: `<script id="ssg-data" type="application/json">${dataText}</script><script type="module">${deserializeText}</script>`,
  body: `<div id="ssg-content">${serializeContent(app)}</div>`,
});
Deno.writeTextFileSync("index.html", outputText);
