import S from "https://cdn.skypack.dev/s-js";
import reconcile from "./reconcile.js";
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
      strings.map((s, i) => s + (i < args.length ? args[i] : "")).join("")
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

function patch(parent, value, current) {
  while (typeof current === "function") {
    current = current();
  }
  if (value === current) {
    return current;
  }
  const valueType = typeof value;
  if (valueType === "string" || valueType === "number") {
    if (valueType === "number") {
      value = value.toString();
    }
    if (current instanceof Comment) {
      parent.removeChild(current);
    } else if (current instanceof Node) {
      current.nodeValue = value;
      return current;
    } else if (Array.isArray(current)) {
      clear(parent, current);
    }
    value = document.createTextNode(value);
    parent.appendChild(value);
    return value;
  } else if (value == null || valueType === "boolean") {
    return clear(parent, current, value);
  } else if (valueType === "function") {
    return S((acc) => patch(parent, value(), acc), current);
  } else if (Array.isArray(value)) {
    const array = normalize(value);
    if (array.length === 0) {
      return clear(parent, current, "[]");
    } else {
      if (Array.isArray(current)) {
        reconcile(parent, current, array);
      } else if (current instanceof Node) {
        reconcile(parent, [current], array);
      } else {
        for (let i = 0; i < array.length; i++) {
          parent.appendChild(array[i]);
        }
      }
      return array;
    }
  } else if (value instanceof Node) {
    if (Array.isArray(current)) {
      reconcile(parent, current, [value]);
    } else if (current instanceof Node) {
      parent.replaceChild(value, current);
    } else {
      parent.appendChild(value);
    }
    return value;
  } else {
    return current;
  }
}

const signals = deserialize(document.getElementById("ssg-data").textContent);
const nodes = getSignalNodes(document.querySelector("main"));

for (let key in nodes) {
  const node = nodes[key];
  const parent = node.parentNode;
  S((current) => patch(parent, signals[key](), current), node);
}
