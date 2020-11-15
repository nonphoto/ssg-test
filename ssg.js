import paramCase from "https://deno.land/x/case/paramCase.ts";
import htmlVoidElements from "https://cdn.skypack.dev/html-void-elements";
import htmlTagNames from "https://cdn.skypack.dev/html-tag-names";
import svgTagNames from "https://cdn.skypack.dev/svg-tag-names";

export function serialize(data) {
  if (typeof data === "string") {
    return data;
  } else if (Array.isArray(data)) {
    return data.map(serialize).join("");
  } else if (typeof data === "object") {
    const { tag = "div", children, ...rest } = data;
    const attributes = Object.entries(rest).map(([key, value]) => {
      return `${paramCase(key)}='${value}'`;
    });
    const tagString = [tag, ...attributes].join(" ");
    if (htmlVoidElements.includes(tag)) {
      return `<${tagString}/>`;
    } else {
      return `<${tagString}>${serialize(children)}</${tag}>`;
    }
  } else if (data == null) {
    return "";
  } else {
    return data.toString();
  }
}

export async function resolve(data) {
  if (data instanceof Promise) {
    return Promise.then(resolve);
  } else if (Array.isArray(data)) {
    return Promise.all(data.map(resolve));
  } else if (typeof data === "object") {
    const { children, ...rest } = data;
    const resolved = await resolve(children);
    return { children: resolved, ...rest };
  } else {
    return data;
  }
}

export function map(fn, data) {
  if (Array.isArray(data)) {
    return data.map((datum) => map(fn, datum));
  } else if (typeof data === "object") {
    const { children, ...rest } = data;
    return { children: map(fn, children), ...fn(rest) };
  } else {
    return data;
  }
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
