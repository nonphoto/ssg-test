export default ({ title, src }) => {
  return {
    tag: "div",
    inner: [
      {
        tag: "div",
        inner: title,
      },
      { tag: "img", src },
    ],
  };
};
