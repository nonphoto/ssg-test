import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import writePage from "./ssg.js";
import items from "./data/items.js";

const outDir = "public";
const inDir = "pages";

const data = {
  items: items.map((item) => ({ ...item, slug: item.title.toLowerCase() })),
};

for await (const file of fs.expandGlob(path.join(inDir, "**/*.js"))) {
  const importResult = await import(file.path);
  writePage(
    path.resolve(
      outDir,
      path.relative(inDir, file.path).replace(".js", ".html")
    ),
    importResult.default(data)
  );
}

const itemPartial = await import("./partials/item.js");
for await (const item of data.items) {
  writePage(path.join(outDir, item.slug) + ".html", itemPartial.default(item));
}

fs.copy("static", outDir, { overwrite: true });
