export default ({ items }) => {
  return [
    { style: { display: "flex" } },
    items.map(({ title, slug }) => [
      { tag: "a", href: `/${slug}.html` },
      title,
    ]),
  ];
};
