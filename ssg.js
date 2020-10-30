import { renderFileToString } from "https://deno.land/x/dejs@0.8.0/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

function toKebabCase(string) {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

function partition(array, fn) {
  return [array.filter(fn), array.filter((v) => !fn(v))];
}

async function serialize(node) {
  if (typeof node === "string") {
    return node;
  } else if (typeof node === "function") {
    return await serialize(node());
  } else if (node instanceof Promise) {
    return await node;
  } else if (Array.isArray(node)) {
    const parts = await Promise.all(node.map(serialize));
    const [tagAndAttributes, children] = partition(
      parts,
      (value) => typeof value === "object"
    );
    const serializedChildren = children.join("");
    const { tag = "span", ...attributes } = Object.assign(
      {},
      ...tagAndAttributes
    );
    const serializedAttributes = serializeAttributes(attributes);
    const tagAndSerializedAttributes = [tag, ...serializedAttributes].join(" ");
    return `<${tagAndSerializedAttributes}>${serializedChildren}</${tag}>`;
  } else if (typeof node === "object") {
    return node;
  } else {
    return node.toString();
  }
}

function serializeAttributes(attributes) {
  return Object.entries(attributes).map(([key, value]) => {
    if (key === "style") {
      const styleString = Object.entries(value)
        .map(
          ([styleKey, styleValue]) =>
            `${toKebabCase(styleKey)}:${styleValue.toString()};`
        )
        .join("");
      return `style="${styleString}"`;
    } else {
      return `${key}="${value}"`;
    }
  });
}

export async function importDeep(dir) {
  let entries = [];
  for await (const dirEntry of Deno.readDir(dir)) {
    if (dirEntry.isFile) {
      const importPath = path.resolve(dir, dirEntry.name);
      const importResult = await import(importPath);
      entries.push([importPath, importResult]);
    } else if (dirEntry.isDirectory) {
      const importPath = path.join(dir, dirEntry.name);
      const importResult = await importDeep(importPath);
      entries = [...entries, ...importResult];
    }
  }
  return new Map(entries);
}

export function toOutPath(inPath, outPath) {
  return path.resolve(
    outPath,
    path.relative("./pages", inPath).replace(".js", ".html")
  );
}

export async function build(outPath, tree) {
  const body = await serialize(tree);
  const outputText = await renderFileToString("./template.ejs", {
    head: ``,
    body: `<div id="ssg-content">${body}</div>`,
  });
  outPath = path.normalize(outPath);
  await fs.ensureFile(outPath);
  await Deno.writeTextFile(outPath, outputText);
}
