import { element, sink, source, time } from "./dom.js";

export default element(
  "div",
  [element("span", "hello"), element("strong", "world")],
  element(
    "span",
    sink((t) => Math.floor(t * 0.001), time)
  ),
  element("span", source("!"))
);
