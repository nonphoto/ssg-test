import css from "../css.js";

export default ({ items }) => {
  return {
    tag: "div",
    ...css({
      display: "flex",
      flexDirection: "column",
      background: "#eee",
      "@media (min-width: 100px)": { a: { color: "red" } },
    }),
    inner: items.map(({ title, slug }) => ({
      tag: "a",
      href: `/${slug}.html`,
      inner: title,
    })),
  };
};
