import S from "https://cdn.skypack.dev/s-js";
import { defineComponent } from "/lib/dom.js";

const time = S.data(0);
function loop(t) {
  time(t);
  requestAnimationFrame(loop);
}
loop();

defineComponent("main", (props) => {
  return {
    message: props.message,
    time: S(() => Math.floor(time() * 0.001)),
  };
});
