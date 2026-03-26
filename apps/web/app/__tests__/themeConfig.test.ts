import {
  THEME_NAMES,
  THEME_PALETTES,
  THEME_LABELS,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "../themeConfig";

describe("themeConfig", () => {
  test("has 7 themes", () => {
    expect(THEME_NAMES).toHaveLength(7);
  });

  test("default theme is dark", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });

  test("storage key is platform-prefixed", () => {
    expect(THEME_STORAGE_KEY).toBe("platform-theme");
  });

  test("every theme has a label", () => {
    for (const name of THEME_NAMES) {
      expect(THEME_LABELS[name]).toBeDefined();
      expect(typeof THEME_LABELS[name]).toBe("string");
    }
  });

  test("every theme has a complete palette", () => {
    const requiredKeys = [
      "slate100",
      "slate300",
      "slate400",
      "slate600",
      "slate700",
      "green400",
      "green900",
      "rowHover",
      "hoverOverlay",
      "error",
      "errorBg",
      "warning",
      "info",
      "success",
    ];
    for (const name of THEME_NAMES) {
      for (const key of requiredKeys) {
        expect(THEME_PALETTES[name]).toHaveProperty(key);
      }
    }
  });
});
