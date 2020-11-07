import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { allProps, serialize } from "./ssg.js";
import items from "./data/items.js";

const outDir = "public";
const inDir = "pages";

const template = async ({ head, body }) => {
  let extractedCss = "";
  for await (const { css } of allProps(body)) {
    if (css) {
      extractedCss += css;
    }
  }

  return [
    { tag: "html", lang: "en" },
    [
      { tag: "head" },
      [
        {
          tag: "meta",
          name: "viewport",
          content: "width=device-width, initial-scale=1.0",
        },
      ],
      [{ tag: "meta", charset: "utf-8" }],
      [{ tag: "script", type: "module", src: "index.js" }],
      head,
      [{ tag: "style" }, extractedCss],
    ],
    [{ tag: "body" }, body],
  ];
};

async function writePage(slug, data) {
  const outText = await serialize(template(data));
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
  writePage(slug, { body });
}

const itemPartial = await import("./partials/item.js");
for await (const item of data.items) {
  const body = itemPartial.default(item);
  writePage(item.slug, { body });
}

fs.copy("static", outDir, { overwrite: true });
