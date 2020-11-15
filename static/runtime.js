import S from "https://cdn.skypack.dev/s-js";
window.S = S;

const data = JSON.parse(document.getElementById("ssg-data").textContent);
console.log(data);
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

console.log(instances);
