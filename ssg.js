import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import paramCase from "https://deno.land/x/case/camelCase.ts";

function partition(array, fn) {
  return [array.filter(fn), array.filter((v) => !fn(v))];
}

async function resolve(data) {
  if (typeof data === "function") {
    return resolve(data());
  } else if (data instanceof Promise) {
    const result = await data;
    return resolve(result);
  } else {
    return data;
  }
}

async function serialize(data) {
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
    return `<${tagAndSerializedAttributes}>${serializedChildren.join(
      ""
    )}</${tag}>`;
  } else if (resolved == null) {
    return "";
  } else {
    return resolved.toString();
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

export default async function (outPath, data) {
  const body = await serialize(data);
  const outputText = await renderFileToString("./template.ejs", {
    head: ``,
    body: `<div id="ssg-content">${body}</div>`,
  });
  outPath = path.normalize(outPath);
  await fs.ensureFile(outPath);
  await Deno.writeTextFile(outPath, outputText);
}
