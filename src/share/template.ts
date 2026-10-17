export type TemplateVars = Readonly<Record<string, string | number>>;

export function fillTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}
