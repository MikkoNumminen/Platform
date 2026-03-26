import { render, screen } from "@testing-library/react";
import BoardsLoading from "../boards/loading";
import BoardLoading from "../boards/[slug]/loading";
import PostLoading from "../boards/[slug]/[postSlug]/loading";
import ForumsLoading from "../forums/loading";
import CalendarLoading from "../calendar/loading";

describe("Loading skeletons", () => {
  test("BoardsLoading renders skeleton elements", () => {
    render(<BoardsLoading />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });

  test("BoardLoading renders skeleton elements", () => {
    render(<BoardLoading />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });

  test("PostLoading renders skeleton elements", () => {
    render(<PostLoading />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });

  test("ForumsLoading renders skeleton elements", () => {
    render(<ForumsLoading />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });

  test("CalendarLoading renders skeleton elements", () => {
    render(<CalendarLoading />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });
});
