export default ({ title, src }) => {
  return {
    tag: "div",
    children: [
      {
        tag: "div",
        children: title,
      },
      { tag: "img", src },
    ],
  };
};
