import S from "https://cdn.skypack.dev/s-js";
import { patch } from "./dom.js";
import { Name, ArgType } from "./signal.js";

const time = S.data(0);

(function loop(t) {
  time(t);
  requestAnimationFrame(loop);
})();

const signalLookup = {
  [Name.Value]: S.value,
  [Name.Floor]: (x) => S(() => Math.floor(x())),
  [Name.Mul]: (a, b) => S(() => a() * b()),
  [Name.Format]: (strings, ...args) =>
    S(() =>
      strings()
        .map((s, i) => s + (i < args.length ? args[i]() : ""))
        .join("")
    ),
  [Name.Time]: () => time,
};

const deserialize = (string) => {
  const data = JSON.parse(string).signalTemplates;
  const completed = {};
  const create = (key) => {
    const [name, ...args] = data[key];
    if (!completed[key]) {
      completed[key] = signalLookup[name](
        ...args.map(([argType, argValue]) => {
          if (argType === ArgType.Signal) {
            return create(argValue);
          } else {
            return () => argValue;
          }
        })
      );
    }
    return completed[key];
  };
  for (let i = 0; i < data.length; i++) {
    create(i);
  }
  return completed;
};

function getSignalNodes(root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT,
    {
      acceptNode: function (node) {
        return node.textContent.startsWith("signal=")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    },
    false
  );
  const result = {};
  let currentNode;
  while ((currentNode = treeWalker.nextNode())) {
    const id = currentNode.textContent.split("=")[1];
    result[id] = currentNode;
  }
  return result;
}

const signals = deserialize(document.getElementById("ssg-data").textContent);
const nodes = getSignalNodes(document.querySelector("main"));

for (let key in nodes) {
  const node = nodes[key];
  const parent = node.parentNode;
  S((current) => patch(parent, signals[key](), current), node);
}
