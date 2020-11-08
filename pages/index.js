import { css, merge, global } from "../css.js";

export default ({ items }) => {
  return {
    tag: "div",
    ...merge(
      css({
        display: "flex",
        flexDirection: "column",
      }),
      global({ div: { border: "solid red 1px" } })
    ),
    inner: items.map(({ title, slug }) => ({
      tag: "a",
      href: `/${slug}.html`,
      inner: title,
    })),
  };
};
