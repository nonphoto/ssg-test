function enumerate(original) {
  return new Proxy(original, {
    get(target, name) {
      return target.indexOf(name);
    },
  });
}

export const Name = enumerate(["Value", "Floor", "Mul", "Format", "Time"]);

export const ArgType = enumerate(["Signal", "Constant"]);

export class SignalTemplate {
  constructor(name, ...args) {
    this.name = name;
    this.args = args;
  }

  getId(allTemplates) {
    return allTemplates.indexOf(this);
  }

  toStub(allTemplates) {
    const { name, args } = this;
    const stubArgs = args.map((arg) =>
      arg instanceof SignalTemplate
        ? [ArgType.Signal, arg.getId(allTemplates)]
        : [ArgType.Constant, arg]
    );
    return [name, ...stubArgs];
  }
}

export function value(value) {
  return new SignalTemplate(Name.Value, value);
}

export function floor(x) {
  return new SignalTemplate(Name.Floor, x);
}

export function mul(a, b) {
  return new SignalTemplate(Name.Mul, a, b);
}

export function format(strings, ...args) {
  return new SignalTemplate(Name.Format, strings, ...args);
}

export const time = new SignalTemplate(Name.Time);
