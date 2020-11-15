import paramCase from "https://deno.land/x/case/paramCase.ts";
import htmlVoidElements from "https://cdn.skypack.dev/html-void-elements";
import htmlTagNames from "https://cdn.skypack.dev/html-tag-names";
import svgTagNames from "https://cdn.skypack.dev/svg-tag-names";
import hash from "https://cdn.skypack.dev/@emotion/hash";

function partition(fn, array) {
  return [array.filter(fn), array.filter((...args) => !fn(...args))];
}

export async function* extractProps(data) {
  if (data instanceof Promise) {
    const result = await data;
    yield* extractProps(result);
  }
  if (Array.isArray(data)) {
    for (let datum of data) {
      yield* extractProps(datum);
    }
  } else if (typeof data === "object") {
    const { children, ...props } = data;
    yield props;
    yield* extractProps(children);
  }
}

export async function serialize(data, ...plugins) {
  const fns = {};
  function insertFn(fn) {
    const args = Array.isArray(fn.args) ? fn.args : [];
    const argKeys = args.map(insertFn);
    const value = fn.toString();
    const key = hash(value);
    fns[key] = [value, ...argKeys];
    return key;
  }
  async function serializeHelper(data) {
    if (data instanceof Promise) {
      const result = await data;
      return serializeHelper(result);
    } else if (typeof data === "function") {
      const key = insertFn(data);
      return `<!-- bind=${key} -->`;
    } else if (typeof data === "string") {
      return data;
    } else if (Array.isArray(data)) {
      const result = await Promise.all(data.map(serializeHelper));
      return result.join("");
    } else if (typeof data === "object") {
      for (const plugin of plugins) {
        if (typeof plugin.map === "function") {
          data = plugin.map(data);
        }
      }
      const { tag = "div", children, ...props } = data;
      let [assign, attributes] = partition(
        ([, value]) => typeof value === "function",
        Object.entries(props)
      );
      assign = assign.map(([key, value]) => {
        const fnKey = insertFn(value);
        return [key, fnKey];
      });
      assign =
        assign.length > 0
          ? [`data-assign='${JSON.stringify(Object.fromEntries(assign))}'`]
          : [];
      attributes = attributes.map(([key, value]) => {
        return `${paramCase(key)}="${value}"`;
      });
      const tagString = [tag, ...attributes, ...assign].join(" ");
      if (htmlVoidElements.includes(tag)) {
        return `<${tagString}/>`;
      } else {
        const childrenString = await serializeHelper(children);
        return `<${tagString}>${childrenString}</${tag}>`;
      }
    } else if (data == null) {
      return "";
    } else {
      return data.toString();
    }
  }
  const body = await serializeHelper(data);
  const head = `<script type="module" src="./runtime.js"></script><script id="ssg-data" type="text/json">${JSON.stringify(
    fns
  )}</script>`;
  return { head, body };
}

export function style(object) {
  return Object.entries(object)
    .map(([key, value]) => `${paramCase(key)}:${value.toString()};`)
    .join("");
}

export function element(tag, attributes, ...children) {
  return { tag, ...attributes, children };
}

export function bind(fn, ...args) {
  fn.args = args;
  return fn;
}

const tagNames = [...htmlTagNames, ...svgTagNames];
for (let tag of tagNames) {
  element[tag] = (attributes, ...children) =>
    element(tag, attributes, ...children);
}
