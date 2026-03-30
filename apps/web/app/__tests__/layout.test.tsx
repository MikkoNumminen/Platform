jest.mock("@/app/components/TutorialProvider", () => {
  return {
    __esModule: true,
    default: function MockTutorialProvider({ children }: { children: React.ReactNode }) {
      return <>{children}</>;
    },
    useTutorial: () => ({
      isActive: false,
      steps: [],
      completedSteps: new Set(),
      currentStep: null,
      completeStep: jest.fn(),
      totalSteps: 0,
      completedCount: 0,
      allComplete: false,
      celebratingStep: null,
      celebratingTier: null,
      dismissCelebration: jest.fn(),
    }),
    useTutorialMaybe: () => null,
    emitTutorialEvent: jest.fn(),
  };
});

jest.mock(
  "@/app/components/TutorialSpotlight",
  () =>
    function MockSpotlight() {
      return null;
    },
);
jest.mock(
  "@/app/components/TutorialCelebration",
  () =>
    function MockCelebration() {
      return null;
    },
);
jest.mock(
  "@/app/components/BottomPanelStack",
  () =>
    function MockBottomPanelStack() {
      return null;
    },
);

jest.mock("@/app/components/PromotionGate", () => {
  return function MockPromotionGate() {
    return null;
  };
});

jest.mock("@/app/components/XpToastProvider", () => {
  return function MockXpToastProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

jest.mock("@/lib/promotion-actions", () => ({
  markPromotionSeen: jest.fn(),
}));

import { metadata } from "../layout";

describe("RootLayout metadata", () => {
  test("has correct default title", () => {
    expect(metadata.title).toEqual(expect.objectContaining({ default: "Platform" }));
  });

  test("has title template", () => {
    expect(metadata.title).toEqual(
      expect.objectContaining({ template: expect.stringContaining("%s") }),
    );
  });

  test("has description", () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe("string");
  });

  test("has metadataBase", () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });

  test("has Open Graph metadata", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        description: expect.any(String),
        siteName: expect.any(String),
        locale: "fi_FI",
        type: "website",
      }),
    );
  });

  test("has Twitter card metadata", () => {
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter).toEqual(
      expect.objectContaining({
        card: "summary_large_image",
        title: expect.any(String),
        description: expect.any(String),
      }),
    );
  });
});
