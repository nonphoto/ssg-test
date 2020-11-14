import paramCase from "https://deno.land/x/case/paramCase.ts";
import htmlVoidElements from "https://cdn.skypack.dev/html-void-elements";
import htmlTagNames from "https://cdn.skypack.dev/html-tag-names";
import svgTagNames from "https://cdn.skypack.dev/svg-tag-names";

export async function resolve(data) {
  if (typeof data === "function") {
    return resolve(data());
  } else if (data instanceof Promise) {
    const result = await data;
    return resolve(result);
  } else {
    return data;
  }
}

export async function* extractProps(data) {
  const resolved = await resolve(data);
  if (Array.isArray(resolved)) {
    for (let item of resolved) {
      yield* extractProps(item);
    }
  } else if (typeof resolved === "object") {
    const { children, ...props } = resolved;
    yield props;
    yield* extractProps(children);
  }
}

export async function serialize(data) {
  const resolved = await resolve(data);
  if (typeof resolved === "string") {
    return resolved;
  } else if (Array.isArray(resolved)) {
    const result = await Promise.all(resolved.map(serialize));
    return result.join("");
  } else if (typeof resolved === "object") {
    const { tag = "div", children, ...attributes } = resolved;
    const serializedAttributes = Object.entries(attributes).map(
      ([key, value]) => {
        if (key === "style") {
          const styleString = Object.entries(value)
            .map(
              ([styleKey, styleValue]) =>
                `${paramCase(styleKey)}:${styleValue.toString()};`
            )
            .join("");
          return `style="${styleString}"`;
        } else {
          return `${paramCase(key)}="${value}"`;
        }
      }
    );
    const tagAndSerializedAttributes = [tag, ...serializedAttributes].join(" ");
    if (htmlVoidElements.includes(tag)) {
      return `<${tagAndSerializedAttributes}/>`;
    } else {
      const serializedChildren = await serialize(children);
      return `<${tagAndSerializedAttributes}>${serializedChildren}</${tag}>`;
    }
  } else if (resolved == null) {
    return "";
  } else {
    return resolved.toString();
  }
}

export function elementStub(tag, attributes, ...children) {
  return { tag, ...attributes, children };
}

const tagNames = [...htmlTagNames, ...svgTagNames];
for (let tag of htmlTagNames) {
  elementStub[tag] = (attributes, ...children) =>
    elementStub(tag, attributes, ...children);
}
