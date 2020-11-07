import emotion from "https://cdn.skypack.dev/@emotion/css";

function css(...args) {
  const { name, styles } = emotion(...args);
  const className = `ssg-${name}`;
  return { class: className, css: `.${className} {${styles}}` };
}

export default ({ items }) => {
  return [
    css({ display: "flex", background: "#eee" }),
    items.map(({ title, slug }) => [
      { tag: "a", href: `/${slug}.html` },
      title,
    ]),
  ];
};
