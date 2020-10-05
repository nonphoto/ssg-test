export class StreamTemplate {
  constructor(value, fn = "", args = []) {
    this.value = value;
    this.fn = fn;
    this.args = args;
  }

  getId(allTemplates) {
    return allTemplates.indexOf(this);
  }

  toObject(allTemplates) {
    const { value, fn, args } = this;
    const flatArgs = args.map((arg) =>
      arg instanceof StreamTemplate
        ? {
            type: "stream",
            value: arg.getId(allTemplates),
          }
        : { type: "value", value: arg }
    );
    return { value, fn, args: flatArgs };
  }
}

const source = (value) => {
  return new StreamTemplate(value);
};

const sink = (fn) => (...args) => {
  return new StreamTemplate(undefined, fn.toString(), args);
};

export const floor = sink((x) => Math.floor(x));
export const add = sink((...args) => args.reduce((a, b) => a + b, 0));
export const sub = sink((...args) => args.reduce((a, b) => a - b, 0));
export const mul = sink((...args) => args.reduce((a, b) => a * b, 1));
export const div = sink((...args) => args.reduce((a, b) => a / b, 1));
export const format = sink((strings, ...args) =>
  strings.map((s, i) => s + (i < args.length ? args[i] : "")).join("")
);
export const time = new StreamTemplate(
  0,
  (() => {
    console.log("time");
    return 0;
  }).toString()
);
