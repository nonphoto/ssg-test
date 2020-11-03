export default ({ items }) => {
  return [
    { css: { display: "flex" } },
    items.map(({ title, slug }) => [
      { tag: "a", href: `/${slug}.html` },
      title,
    ]),
  ];
};
