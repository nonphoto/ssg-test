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
    return [node];
  } else if (node instanceof Sink) {
    return [node, ...node.deps.map(serializeStreams).flat()];
  } else if (node instanceof Element) {
    return node.children.map(serializeStreams).flat();
  } else {
    return [];
  }
}

const time = new Stream("time");

const app = element(
  "div",
  [element("span", "hello"), element("strong", "world")],
  element(
    "span",
    sink((t) => t * 0.001, time)
  ),
  element("span", source("!"))
);

console.log(serializeContent(app), JSON.stringify(serializeStreams(app)));
