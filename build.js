import { importDeep, build, toOutPath } from "./ssg.js";
import items from "./data/items.js";

const importResult = await importDeep("./pages");

for (const [key, value] of importResult) {
  build(
    toOutPath(key, "./public"),
    value.default({
      items: items.map((item) => ({ ...item, slug: item.title.toLowerCase() })),
    })
  );
}
