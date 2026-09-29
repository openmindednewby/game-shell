export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className !== '') {
    node.className = className;
  }
  if (text !== '') {
    node.textContent = text;
  }
  return node;
}

export function iconSpan(doc: Document, svg: string): HTMLSpanElement {
  const span = el(doc, 'span', 'gs-ico');
  span.innerHTML = svg;
  return span;
}

interface ButtonSpec {
  className: string;
  text?: string;
  ariaLabel?: string;
  icon?: string;
  onClick(): void;
}

export function button(doc: Document, spec: ButtonSpec): HTMLButtonElement {
  const btn = el(doc, 'button', spec.className);
  btn.type = 'button';
  if (spec.icon !== undefined) {
    btn.append(iconSpan(doc, spec.icon));
  }
  if (spec.text !== undefined) {
    btn.append(doc.createTextNode(spec.text));
  }
  if (spec.ariaLabel !== undefined) {
    btn.setAttribute('aria-label', spec.ariaLabel);
  }
  btn.addEventListener('click', () => spec.onClick());
  return btn;
}
