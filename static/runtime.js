import S from "https://cdn.skypack.dev/s-js";
import { assign } from "./lib/dom.js";
window.S = S;

const data = JSON.parse(document.getElementById("ssg-data").textContent);
const instances = {};
function instantiate(key) {
  if (!instances[key]) {
    const [fnString, ...args] = data[key];
    const instantiatedArgs = args.map((arg) => instantiate(arg));
    const fn = new Function("return" + fnString)();
    instances[key] = fn(...instantiatedArgs);
  }
  return instances[key];
}
for (const key of Object.keys(data)) {
  instantiate(key);
}

const elements = document.querySelectorAll("[data-assign]");
for (const element of elements) {
  const data = JSON.parse(element.getAttribute("data-assign"));
  assign(
    element,
    Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, instances[value]])
    )
  );
}
