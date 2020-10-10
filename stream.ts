export enum Name {
  Value,
  Floor,
  Mul,
  Format,
  Time,
}

export enum ArgType {
  Stream,
  Constant,
}

export type StreamTemplateStub = [Name, ...[ArgType, any][]];

export class StreamTemplate<T> {
  name: Name;
  args: any[];

  constructor(name: Name, ...args: any[]) {
    this.name = name;
    this.args = args;
  }

  getId(allTemplates: StreamTemplate<any>[]): number {
    return allTemplates.indexOf(this);
  }

  toStub(allTemplates: StreamTemplate<any>[]): StreamTemplateStub {
    const { name, args } = this;
    const stubArgs: [ArgType, any][] = args.map((arg) =>
      arg instanceof StreamTemplate
        ? [ArgType.Stream, arg.getId(allTemplates)]
        : [ArgType.Constant, arg]
    );
    return [name, ...stubArgs];
  }
}

export function value<T>(value: T): StreamTemplate<T> {
  return new StreamTemplate(Name.Value, value);
}

export function floor(x: StreamTemplate<number>): StreamTemplate<number> {
  return new StreamTemplate(Name.Floor, x);
}

export function mul(
  a: StreamTemplate<number> | number,
  b: StreamTemplate<number> | number
): StreamTemplate<number> {
  return new StreamTemplate(Name.Mul, a, b);
}

export function format(
  strings: TemplateStringsArray,
  ...args: any[]
): StreamTemplate<string> {
  return new StreamTemplate(Name.Format, strings, ...args);
}

export const time: StreamTemplate<number> = new StreamTemplate(Name.Time);
