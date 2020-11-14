import S from "https://cdn.skypack.dev/s-js";
import { defineComponent, bind, assign, query, element } from "/lib/dom.js";

const time = S.data(0);
function loop(_t) {
  time(_t);
  requestAnimationFrame(loop);
}
loop();

const mouse = S.data([0, 0]);
window.addEventListener("mousemove", (event) => {
  mouse([event.clientX, event.clientY]);
});

defineComponent("images", (node) => {
  console.log(node);
  assign(node, {
    style: {
      transform: S.on(time, () => {
        const [x, y] = mouse();
        return `translate(${x}px, ${y}px)`;
      }),
    },
  });
});

defineComponent("main", (node) => {
  node.children;
});
