import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as ssg from "./ssg.js";
import { extract as extractCss } from "./css.js";
import items from "./data/items.js";
import hash from "https://cdn.skypack.dev/@emotion/hash";

function partition(fn, array) {
  return [array.filter(fn), array.filter((...args) => !fn(...args))];
}

function extractFns(data) {
  const fns = {};
  function insertFn(fn) {
    const args = Array.isArray(fn.args) ? fn.args : [];
    const argKeys = args.map(insertFn);
    const value = fn.toString();
    const key = hash(value);
    fns[key] = [value, ...argKeys];
    return key;
  }
  const mapped = ssg.map((object) => {
    let [assign, attributes] = partition(
      ([, value]) => typeof value === "function",
      Object.entries(object)
    );
    assign = assign.map(([key, value]) => {
      const fnKey = insertFn(value);
      return [key, fnKey];
    });
    const rest = Object.fromEntries(attributes);
    return assign.length > 0
      ? { ...rest, dataAssign: JSON.stringify(Object.fromEntries(assign)) }
      : rest;
  }, data);
  return [mapped, JSON.stringify(fns)];
}

const outDir = "public";
const inDir = "pages";

const template = ({ body, css, fns }) => {
  return {
    tag: "html",
    lang: "en",
    children: [
      {
        tag: "head",
        children: [
          {
            tag: "meta",
            name: "viewport",
            content: "width=device-width, initial-scale=1.0",
          },
          { tag: "meta", charset: "utf-8" },
          { tag: "script", type: "module", src: "runtime.js" },
          { tag: "script", type: "text/json", id: "ssg-data", children: fns },
          { tag: "style", children: css },
        ],
      },
      { tag: "body", children: body },
    ],
  };
};

async function writePage(slug, data) {
  let body = await ssg.resolve(data);
  let fns, css;
  [body, fns] = extractFns(body);
  [body, css] = extractCss(body);
  const outText = ssg.serialize(template({ body, fns, css }));
  const outPath = path.resolve(outDir, slug.replace(/\..+$/, "") + ".html");
  await fs.ensureFile(outPath);
  await Deno.writeTextFile(outPath, outText);
}

const data = {
  items: items.map((item) => ({ ...item, slug: item.title.toLowerCase() })),
};

for await (const file of fs.expandGlob(path.join(inDir, "**/*.js"))) {
  const importResult = await import(file.path);
  const body = importResult.default(data);
  const slug = path.relative(inDir, file.path);
  writePage(slug, body);
}

const itemPartial = await import("./partials/item.js");
for await (const item of data.items) {
  const body = itemPartial.default(item);
  writePage(item.slug, body);
}

fs.copy("static", outDir, { overwrite: true });
