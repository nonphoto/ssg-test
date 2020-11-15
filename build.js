import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { serialize, extractProps } from "./ssg.js";
import { extract } from "./css.js";
import items from "./data/items.js";
import {
  compile,
  serialize as serializeCss,
  stringify,
} from "https://cdn.skypack.dev/stylis";

const outDir = "public";
const inDir = "pages";

const template = ({ head, body, css }) => {
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
          { tag: "script", type: "module", src: "index.js" },
          { tag: "style", children: css },
          head,
        ],
      },
      { tag: "body", children: body },
    ],
  };
};

async function writePage(slug, data) {
  let extractedCss = "";
  const { head, body } = await serialize(data, {
    map: ({ css, ...rest }) => {
      extractedCss += css;
      return rest;
    },
  });
  const css = serializeCss(compile(extractedCss), stringify);
  const outText = await serialize(template({ head, body, css }));
  console.log(outText);
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
