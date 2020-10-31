import S from "https://cdn.skypack.dev/s-js";
import { defineComponent, patch } from "../dom.js";

const time = S.data(0);
function loop(t) {
  time(t);
  requestAnimationFrame(loop);
}
loop();

defineComponent("main", (refs) => {
  patch(
    refs.time,
    S(() => Math.floor(time() * 0.001))
  );
});
