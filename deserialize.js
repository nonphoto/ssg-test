import S from "https://cdn.skypack.dev/s-js";
import reconcile from "./reconcile.js";

const time = S.data(0);
function loop(t = 0) {
  time(t);
  requestAnimationFrame(loop);
}
loop();

const specialStreamLookup = {
  time,
};

const deserialize = (data) => {
  const completed = {};
  const create = (key) => {
    const item = data[key];
    if (completed[key]) {
    } else if (!item) {
      completed[key] = specialStreamLookup[key];
    } else if ("value" in item) {
      completed[key] = S.data(item.value);
    } else if ("fn" in item && "deps" in item) {
      const completedDeps = item.deps.map(create);
      const fn = new Function("return " + item.fn)();
      completed[key] = S(() => {
        return fn(...completedDeps.map((v) => v()));
      });
    }
    return completed[key];
  };
  for (let key in data) {
    create(key);
  }
  return completed;
};

function getStreamNodes(root) {
  const treeWalker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT,
    {
      acceptNode: function (node) {
        return node.textContent.startsWith("stream=")
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

const streams = deserialize(
  JSON.parse(document.getElementById("stream-data").textContent)
);
const nodes = getStreamNodes(document.querySelector("main"));

for (let key in nodes) {
  const node = nodes[key];
  const parent = node.parentNode;
  S((current) => patch(parent, streams[key](), current), node);
}
