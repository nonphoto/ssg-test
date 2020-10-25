import S from "https://cdn.skypack.dev/s-js";
import { patch, assign } from "./dom.js";
import utils from "./utils.js";

const deserialize = (string) => {
  const data = JSON.parse(string).signalTemplates;
  const completed = {};
  const create = (key) => {
    const [name, ...args] = data[key];
    if (!completed[key]) {
      completed[key] = utils[name](
        ...args.map(([argType, argValue]) => {
          if (argType === 0) {
            return create(argValue);
          } else {
            return argValue;
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

function getPatchNodes(root) {
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
const patchNodes = getPatchNodes(document.querySelector("main"));
const assignNodes = document.querySelectorAll("[data-signal-assign]");

for (let key in patchNodes) {
  const node = patchNodes[key];
  const parent = node.parentNode;
  S((current) => patch(parent, signals[key](), current), node);
}

function mapValues(object, callback) {
  if (typeof object === "object") {
    return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [
        key,
        mapValues(value, callback),
      ])
    );
  } else {
    return callback(object);
  }
}

for (let node of assignNodes) {
  const props = mapValues(
    JSON.parse(node.dataset.signalAssign),
    (id) => signals[id]
  );
  assign(node, props);
}
