export function useTranslations(namespace?: string) {
  return (key: string) => (namespace ? `${namespace}.${key}` : key);
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
