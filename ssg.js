import paramCase from "https://deno.land/x/case/camelCase.ts";
import htmlVoidElements from "https://cdn.skypack.dev/html-void-elements";
import htmlElementAttributes from "https://cdn.skypack.dev/html-element-attributes";

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
    const { inner, ...props } = resolved;
    yield props;
    yield* extractProps(inner);
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
    const { tag = "div", inner, ...attributes } = resolved;
    const serializedAttributes = Object.entries(attributes)
      .filter(
        ([key]) =>
          htmlElementAttributes["*"].includes(key) ||
          htmlElementAttributes[tag].includes(key)
      )
      .map(([key, value]) => {
        if (key === "style") {
          const styleString = Object.entries(value)
            .map(
              ([styleKey, styleValue]) =>
                `${paramCase(styleKey)}:${styleValue.toString()};`
            )
            .join("");
          return `style="${styleString}"`;
        } else {
          return `${key}="${value}"`;
        }
      });
    const tagAndSerializedAttributes = [tag, ...serializedAttributes].join(" ");
    if (htmlVoidElements.includes(tag)) {
      return `<${tagAndSerializedAttributes}/>`;
    } else {
      const serializedInner = await serialize(inner);
      return `<${tagAndSerializedAttributes}>${serializedInner}</${tag}>`;
    }
  } else if (resolved == null) {
    return "";
  } else {
    return resolved.toString();
  }
}
