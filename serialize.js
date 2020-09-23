class Source {
  constructor(value) {
    this.value = value;
  }
}

class Sink {
  constructor(fn, ...deps) {
    this.fn = fn.toString();
    this.deps = deps;
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
        assign(arg[i]);
      }
    } else if (
      argType === "string" ||
      arg instanceof Element ||
      arg instanceof Source ||
      arg instanceof Sink
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

export function serialize(node) {
  if (typeof Node === "string") {
    return node;
  } else if (node instanceof Sink || node instanceof Source) {
    return `<!--stream-->`;
  } else if (node instanceof Element) {
    const inner = node.children.map(serialize).join("");
    const attributes = Object.entries(node.attributes)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join("");
    return `<${node.tagName}${attributes}>${inner}</${node.tagName}>`;
  } else {
    return node.toString();
  }
}

const time = new Source();

console.log(
  serialize(
    element(
      "div",
      element("span", "hello"),
      element("strong", "world"),
      element(
        "span",
        sink((t) => t * 0.001, time)
      ),
      element("span", source("!"))
    )
  )
);
