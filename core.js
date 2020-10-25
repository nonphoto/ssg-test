export async function importTokens(...args) {
  const object = await import(...args);
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
      if (typeof value === "function") {
        const fn = (...args) => ({ name: key, args });
        fn.name = key;
        return [key, fn];
      } else {
        return [key, { name: key }];
      }
    })
  );
}

export function token(name) {
  return { name };
}

export function isToken(object) {
  return typeof object.name === "string";
}

export function element(tagName, attributes, ...children) {
  return { tagName, attributes, children };
}

export function isElement(object) {
  return (
    typeof object.tagName === "string" &&
    typeof object.attributes === "object" &&
    Array.isArray(object.children)
  );
}
