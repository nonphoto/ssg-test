let nextId = 0;

export class Stream {
  constructor(id) {
    if (id) {
      this.id = id;
    } else {
      this.id = nextId++;
    }
  }
}

export class Source extends Stream {
  constructor(value) {
    super();
    this.value = value;
  }
}

export class Sink extends Stream {
  constructor(fn, ...deps) {
    super();
    this.fn = fn.toString();
    this.deps = deps.map((dep) => dep.id);
  }
}

export class Element {
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

export const time = new Stream("time");
