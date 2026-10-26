export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function without<T>(items: T[], value: T): T[] {
  return items.filter((item) => item !== value);
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function sample<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

export function percent(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export function scrollToElement(element: Element | null, smooth = true): void {
  if (!element) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: smooth && !reducedMotion ? "smooth" : "auto", block: "start" });
}
