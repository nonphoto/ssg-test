import { css, merge, global } from "../css.js";

export default ({ items }) => {
  return {
    children: [
      {
        dataComponent: "main",
        dataMessage: "Timer: ",
        children: [{ class: "message" }, { class: "time" }],
      },
      {
        ...merge(
          css({
            display: "flex",
            flexDirection: "column",
          }),
          global({ div: { border: "solid red 1px" } })
        ),
        children: items.map(({ title, slug }) => ({
          tag: "a",
          href: `/${slug}.html`,
          children: title,
        })),
      },
    ],
  };
};
