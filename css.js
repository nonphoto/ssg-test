import { serializeStyles } from "https://cdn.skypack.dev/@emotion/serialize";
import { compile, serialize, stringify } from "https://cdn.skypack.dev/stylis";
import { extractProps } from "./ssg.js";

export default function (...args) {
  const { name, styles } = serializeStyles(args);
  const className = `ssg-${name}`;
  return { class: className, css: `.${className} {${styles}}` };
}

export function global(...args) {
  const { styles } = serializeStyles(...args);
  return { css: styles };
}

export async function extract(data) {
  let extractedCss = "";
  for await (const { css } of extractProps(data)) {
    if (css) {
      extractedCss += css;
    }
  }
  return serialize(compile(extractedCss), stringify);
}
