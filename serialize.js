import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";

let nextId = 0;

class Stream {
  constructor(id) {
    if (id) {
      this.id = id;
    } else {
      this.id = nextId++;
    }
  }
}

class Source extends Stream {
  constructor(value) {
    super();
    this.value = value;
  }
}

class Sink extends Stream {
  constructor(fn, ...deps) {
    super();
    this.fn = fn.toString();
    this.deps = deps.map((dep) => dep.id);
  }
}

class Element {
  constructor(tagName, ...args) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    for (let i = 0; i < args.length; i++) {
      this.assign(args[i]);
    }
  }

  assign(arg) {
    const argType = typeof arg;
    if (arg == null || argType === "boolean") {
    } else if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length; i++) {
        this.assign(arg[i]);
      }
    } else if (
      argType === "string" ||
      arg instanceof Element ||
      arg instanceof Stream
    ) {
      this.children.push(arg);
    } else if (argType === "object") {
      Object.assign(this.attributes, arg);
    } else {
      this.children.push(arg.toString());
    }
  }
}

export function element(...args) {
  return new Element(...args);
}

export function sink(...args) {
  return new Sink(...args);
}

export function source(...args) {
  return new Source(...args);
}

export function serializeContent(node) {
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

export function serializeStreams(node) {
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

const time = new Stream("time");

const app = element(
  "div",
  [element("span", "hello"), element("strong", "world")],
  element(
    "span",
    sink((t) => Math.floor(t * 0.001), time)
  ),
  element("span", source("!"))
);

const dataText = JSON.stringify(serializeStreams(app));
const deserializeText = Deno.readTextFileSync("./deserialize.js");
const outputText = await renderFileToString("index.ejs", {
  head: `<script id="ssg-data" type="application/json">${dataText}</script><script type="module">${deserializeText}</script>`,
  body: `<div id="ssg-content">${serializeContent(app)}</div>`,
});
Deno.writeTextFileSync("index.html", outputText);
