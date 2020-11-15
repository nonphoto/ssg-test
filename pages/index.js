import { css, global } from "../css.js";
import { element, bind } from "../ssg.js";

export default ({ items }) => {
  // const coefficient = script(() => 0.001);
  // const time = script((c) => {
  //   const time = S.data(0);
  //   function loop(_t) {
  //     time(_t * c);
  //     requestAnimationFrame(loop);
  //   }
  //   loop();
  //   return time;
  // }, coefficient);
  const mouse = () => {
    const mouse = S.data([0, 0]);
    window.addEventListener("mousemove", (event) => {
      mouse([event.clientX, event.clientY]);
    });
    return [100, 100];
  };
  return element.div(
    {
      ...global({ html: { fontFamily: "-apple-system, sans-serif" } }),
    },
    // element.div({}, mouse),
    element.div(
      {
        ...css({
          fontSize: "10vmin",
          fontWeight: 700,
          letterSpacing: "-0.05ch",
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }),
      },
      ...items.map(({ title, slug }) =>
        element.a(
          {
            href: `/${slug}.html`,
            ...css({
              textDecoration: "none",
              color: "inherit",
            }),
          },
          title
        )
      )
    ),
    element.div(
      {
        ...css({
          position: "fixed",
          top: 0,
          left: 0,
        }),
        style: bind(([x]) => `transform: translateX(${x}px)`, mouse),
      },
      ...items.map(({ src }) =>
        element.img({ src, ...css({ position: "absolute", top: 0, left: 0 }) })
      )
    )
  );
};
