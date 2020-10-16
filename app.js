import { element } from "./element.js";
import { mul, format, floor, time } from "./signal.js";

export default element(
  "div",
  { style: { display: "flex" } },
  element("div", {
    style: {
      width: "1em",
      height: "1em",
      borderRadius: "1em",
      marginRight: "1ch",
      backgroundColor: format`hsl(${mul(time, 0.1)}, 50%, 50%)`,
    },
  }),
  element("span", floor(mul(time, 0.001)))
);
