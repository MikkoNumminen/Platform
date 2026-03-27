// eslint-disable-next-line @typescript-eslint/no-require-imports
const messages = require("../../messages/en.json");

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function useTranslations(namespace?: string) {
  return (key: string) => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    return getNestedValue(messages, fullPath);
  };
}

export function useLocale() {
  return "fi";
}

export function NextIntlClientProvider({
  children,
}: {
  children: React.ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
}) {
  return children;
}
