export default () => {
  return [
    { component: "main", style: { display: "flex" } },
    [
      {
        ref: "color",
        style: {
          width: "2em",
          height: "1em",
          borderRadius: "1em",
          marginRight: "1ch",
          backgroundColor: "#ddd",
        },
      },
    ],
    [{ ref: "time" }, 0],
    [{ tag: "button", ref: "less" }, "less"],
    [{ tag: "button", ref: "more" }, "more"],
    [{ ref: "count" }, 0],
  ];
};
