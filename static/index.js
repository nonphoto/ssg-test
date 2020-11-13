import S from "https://cdn.skypack.dev/s-js";
import { defineComponent, bind, query } from "/lib/dom.js";

const time = S.data(0);
function loop(_t) {
  time(_t);
  requestAnimationFrame(loop);
}
loop();

defineComponent("main", (node) => {
  const now = performance.now();
  bind(query(".message", node), node.dataset.message);
  bind(
    query(".time", node),
    S(() => Math.floor((time() - now) * 0.001))
  );
  return () => {
    console.log("disposed");
  };
});
