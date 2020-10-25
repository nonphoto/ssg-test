import S from "https://cdn.skypack.dev/s-js";

const call = (value) => (typeof value === "function" ? value() : value);

export const time = S.data(0);

if (typeof window !== "undefined") {
  ((t) => {
    time(t);
    requestAnimationFrame(loop);
  })(0);
}

export const value = S.value;

export const data = S.data;

export const floor = (x) => S(() => Math.floor(call(x)));

export const ceil = (x) => S(() => Math.ceil(call(x)));

export const add = (a, b) => S(() => call(a) + call(b));

export const sub = (a, b) => S(() => call(a) - call(b));

export const mul = (a, b) => S(() => call(a) * call(b));

export const div = (a, b) => S(() => call(a) / call(b));

export const format = (strings, ...args) =>
  S(() =>
    strings.map((s, i) => s + (i < args.length ? call(args[i]) : "")).join("")
  );

export const constant = (c, s) => S.on(s, () => c);
