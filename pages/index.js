import { css, merge, global } from "../css.js";

export default ({ items }) => {
  return {
    tag: "div",
    inner: [
      {
        tag: "div",
        dataComponent: "main",
        inner: [
          {
            tag: "span",
            dataRef: "main.message",
          },
          {
            tag: "span",
            dataRef: "main.time",
          },
        ],
      },
      {
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
      },
    ],
  };
};
