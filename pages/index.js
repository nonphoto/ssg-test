import { css, global } from "../css.js";
import { element } from "../ssg.js";

export default ({ items }) => {
  return element.div(
    {
      ...global({ html: { fontFamily: "-apple-system, sans-serif" } }),
      dataComponent: "main",
    },
    element.div(
      {
        dataComponent: "links",
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
        dataComponent: "images",
        ...css({
          position: "fixed",
          top: 0,
          left: 0,
        }),
      },
      ...items.map(({ src }) =>
        element.img({ src, ...css({ position: "absolute", top: 0, left: 0 }) })
      )
    )
  );
};
