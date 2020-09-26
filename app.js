import { element, sink, source, time } from "./dom.js";

export default element(
  "div",
  element("div", {
    style: {
      width: "1em",
      height: "1em",
      borderRadius: "1em",
      backgroundColor: sink((t) => `hsl(${t * 0.01}deg, 50%, 100%)`, time),
    },
  }),
  element(
    "span",
    sink((t) => Math.floor(t * 0.001), time)
  ),
  element("span", source("!"))
);
