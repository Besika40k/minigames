type ElementChild = Node | string;

export interface CreateElementOptions {
  className?: string;
  text?: string;
  attributes?: Readonly<Record<string, string>>;
  children?: readonly ElementChild[];
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: CreateElementOptions = {},
): HTMLElementTagNameMap[K] {
  const element: HTMLElementTagNameMap[K] = document.createElement(tagName);

  if (options.className !== undefined) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  const attributes: [string, string][] = Object.entries(options.attributes ?? {});
  for (const [name, value] of attributes) {
    element.setAttribute(name, value);
  }

  element.append(...(options.children ?? []));

  return element;
}
