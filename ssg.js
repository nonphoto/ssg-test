import paramCase from "https://deno.land/x/case/camelCase.ts";
import htmlVoidElements from "https://cdn.skypack.dev/html-void-elements";

function partition(array, fn) {
  return [array.filter(fn), array.filter((v) => !fn(v))];
}

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

export async function serialize(data) {
  const resolved = await resolve(data);
  if (typeof resolved === "string") {
    return resolved;
  } else if (Array.isArray(resolved)) {
    const resolvedItems = await Promise.all(resolved.map(resolve));
    const [props, children] = partition(
      resolvedItems,
      (item) => typeof item === "object" && !Array.isArray(item)
    );
    const serializedChildren = await Promise.all(
      children.map((child) => serialize(child))
    );
    const { tag = "div", ...attributes } = Object.assign({}, ...props);
    const serializedAttributes = serializeAttributes(attributes);
    const tagAndSerializedAttributes = [tag, ...serializedAttributes].join(" ");

    if (htmlVoidElements.includes(tag)) {
      return `<${tagAndSerializedAttributes}/>`;
    } else {
      return `<${tagAndSerializedAttributes}>${serializedChildren.join(
        ""
      )}</${tag}>`;
    }
  } else if (resolved == null) {
    return "";
  } else {
    return resolved.toString();
  }
}

export async function* allProps(data) {
  const resolved = await resolve(data);
  if (Array.isArray(resolved)) {
    const [props, children] = partition(
      resolved,
      (item) => typeof item === "object" && !Array.isArray(item)
    );
    yield Object.assign({}, ...props);
    for (let child of children) {
      yield* allProps(child);
    }
  } else if (typeof resolved === "object") {
    yield resolved;
  }
}

function serializeAttributes(attributes) {
  return Object.entries(attributes).map(([key, value]) => {
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
}
