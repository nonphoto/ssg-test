import S from "https://cdn.skypack.dev/s-js";

const deserialize = (data) => {
  const completed = {};
  const create = (i) => {
    const item = data[i];
    if (completed[i]) {
    } else if ("value" in item) {
      completed[i] = S.data(item.value);
    } else if ("fn" in item && "deps" in item) {
      const completedDeps = item.deps.map(create);
      const fn = new Function("return " + item.fn)();
      completed[i] = S(() => {
        return fn(...completedDeps.map((v) => v()));
      });
    }
    return completed[i];
  };
  for (let i = 0; i < data.length; i++) {
    create(i);
  }
  return completed;
};

const result = deserialize([
  { value: 1 },
  { value: 2 },
  { fn: "(a, b) => a + b", deps: [0, 1] },
]);

console.log(result);

S(() => console.log(result[2]()));
result[0](3);
result[1](-1);
