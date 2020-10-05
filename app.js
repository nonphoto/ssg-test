import { element } from "./element.js";
import { mul, format, floor, time } from "./stream.js";

export default element(
  "div",
  element("div", {
    style: {
      width: "1em",
      height: "1em",
      borderRadius: "1em",
      backgroundColor: format`hsl(${mul(time, 0.01)}deg, 50%, 100%)`,
    },
  }),
  element("span", floor(mul(time, 0.001)))
);
