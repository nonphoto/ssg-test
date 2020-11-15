import { serializeStyles } from "https://cdn.skypack.dev/@emotion/serialize";
import { compile, serialize, stringify } from "https://cdn.skypack.dev/stylis";
import * as ssg from "./ssg.js";

export function css(...args) {
  const { name, styles } = serializeStyles(args);
  const className = `class-${name}`;
  return { class: className, css: `.${className} {${styles}}` };
}

export function global(...args) {
  const { styles } = serializeStyles(args);
  return { css: styles };
}

export function merge(...args) {
  const classNames = [];
  const cssFragments = [];
  for (const arg of args) {
    if (arg.class) {
      classNames.push(arg.class);
    }
    if (arg.css) {
      cssFragments.push(arg.css);
    }
  }
  return { class: classNames.join(" "), css: cssFragments.join(" ") };
}

export function extract(data) {
  let extractedCss = "";
  const mapped = ssg.map(({ css, ...rest }) => {
    extractedCss += css;
    return rest;
  }, data);
  return [mapped, serialize(compile(extractedCss), stringify)];
}
