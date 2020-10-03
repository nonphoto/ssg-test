export class StreamTemplate {
  constructor(name) {
    this.name = name;
    this.deps = [];
  }

  getId(allTemplates) {
    return allTemplates.indexOf(this);
  }

  toObject(allTemplates) {
    const result = {};
    const deps = this.deps.map((dep) => dep.getId(allTemplates));
    if (typeof this.value !== "undefined") {
      result.value = this.value;
    }
    if (typeof this.name === "string") {
      result.name = this.name;
    }
    if (typeof this.fn === "function") {
      result.fn = this.fn.toString();
    }
    if (deps.length > 0) {
      result.deps = deps;
    }
    return result;
  }
}

export function source(value) {
  const result = new StreamTemplate();
  result.value = value;
  return result;
}

export function sink(fn, ...deps) {
  const result = new StreamTemplate();
  result.fn = fn;
  result.deps = deps;
  return result;
}

export const time = new StreamTemplate("time");
