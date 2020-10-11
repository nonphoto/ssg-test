import { SignalTemplate } from "./signal.js";

export class ElementTemplate {
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
      arg instanceof ElementTemplate ||
      arg instanceof SignalTemplate
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
  return new ElementTemplate(...args);
}
