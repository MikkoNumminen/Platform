import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterMotionProps(props)}>{children}</div>
    ),
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <svg {...filterMotionProps(props)}>{children}</svg>
    ),
    path: (props: Record<string, unknown>) => <path {...filterMotionProps(props)} />,
  },
}));

function filterMotionProps(props: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!["initial", "animate", "transition", "whileHover", "whileTap"].includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

import WelcomeHero from "@/app/components/WelcomeHero";

describe("WelcomeHero", () => {
  test("renders welcome title", () => {
    render(<WelcomeHero />);
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  test("renders step instructions", () => {
    render(<WelcomeHero />);
    expect(screen.getByText(/try demo/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in with google or github/i)).toBeInTheDocument();
    expect(screen.getByText(/alias/i)).toBeInTheDocument();
    expect(screen.getByText(/review and approve/i)).toBeInTheDocument();
  });

  test("does not render 'Click Sign In' text", () => {
    render(<WelcomeHero />);
    expect(screen.queryByText(/click sign in/i)).not.toBeInTheDocument();
  });

  test("renders private community description", () => {
    render(<WelcomeHero />);
    expect(screen.getByText(/private community platform/i)).toBeInTheDocument();
  });
});
