import { importTokens, element } from "./core.js";

const $ = await importTokens("./utils.js");

export default () => {
  const less = $.value();
  const more = $.value();
  const count = $.range(
    $.scan($.add, $.merge($.constant(-1, less), $.constant(1, more)))
  );

  return element(
    "div",
    { style: { display: "flex" } },
    element("div", {
      style: {
        width: "2em",
        height: "1em",
        borderRadius: "1em",
        marginRight: "1ch",
        backgroundColor: $.format`hsl(${$.mul($.time, 0.1)}, 50%, 50%)`,
      },
    }),
    $.floor($.mul(time, 0.001)),
    element("div", { onclick: less }, "less"),
    element("div", { onclick: more }, "more"),
    element("div", {}, count)
    // mapElement((index) => element("span", {}, index), count)
  );
};
