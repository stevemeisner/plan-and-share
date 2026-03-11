import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../components/plans/StatusBadge";
import { CommentComposer } from "../components/comments/CommentComposer";
import { TimelineEntry } from "../components/timeline/TimelineEntry";

describe("StatusBadge", () => {
  it("renders correct label for each status", () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeDefined();

    rerender(<StatusBadge status="in_review" />);
    expect(screen.getByText("In Review")).toBeDefined();

    rerender(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeDefined();

    rerender(<StatusBadge status="rejected" />);
    expect(screen.getByText("Changes Requested")).toBeDefined();
  });
});

describe("CommentComposer", () => {
  it("renders with placeholder text", () => {
    render(
      <CommentComposer
        onSubmit={() => {}}
        onCancel={() => {}}
        placeholder="Test placeholder"
      />
    );
    expect(screen.getByPlaceholderText("Test placeholder")).toBeDefined();
  });

  it("disables submit when empty", () => {
    render(<CommentComposer onSubmit={() => {}} onCancel={() => {}} />);
    const submitBtns = screen.getAllByText("Comment");
    const submitBtn = submitBtns[submitBtns.length - 1];
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("TimelineEntry", () => {
  it("renders approval entry", () => {
    render(
      <TimelineEntry
        type="approved"
        authorName="Alex"
        timestamp={Date.now()}
      />
    );
    expect(screen.getByText("Alex")).toBeDefined();
    expect(screen.getByText(/Approved/)).toBeDefined();
  });

  it("renders version push with version number", () => {
    render(
      <TimelineEntry
        type="version_pushed"
        authorName="Steve"
        timestamp={Date.now()}
        versionNumber={3}
      />
    );
    expect(screen.getByText(/v3/)).toBeDefined();
  });
});
