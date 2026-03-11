import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { TimelineEntry } from "./TimelineEntry";

interface ReviewTimelineProps {
  planId: string;
  planCreatedAt: number;
  planCreatedByName: string;
}

export function ReviewTimeline({ planId, planCreatedAt, planCreatedByName }: ReviewTimelineProps) {
  const reviews = useQuery(api.reviews.listByPlan, { planId: planId as any }) ?? [];
  const versions = useQuery(api.planVersions.listByPlan, { planId: planId as any }) ?? [];
  const users = useQuery(api.users.list, {}) as Array<{ _id: string; name: string }> | undefined;

  const userName = (userId: string | undefined | null) =>
    userId ? (users?.find((u) => u._id === userId)?.name ?? "Unknown") : "CLI";

  type TimelineEvent = {
    type: "approved" | "changes_requested" | "version_pushed" | "created";
    authorName: string;
    timestamp: number;
    note?: string;
    versionNumber?: number;
  };

  const events: TimelineEvent[] = [];

  for (const review of reviews) {
    events.push({
      type: (review as any).action,
      authorName: userName((review as any).authorId),
      timestamp: (review as any).createdAt,
      note: (review as any).note ?? undefined,
    });
  }

  for (const version of versions) {
    events.push({
      type: "version_pushed",
      authorName: userName((version as any).pushedBy),
      timestamp: (version as any).pushedAt,
      versionNumber: (version as any).version,
      note: (version as any).changeNote ?? undefined,
    });
  }

  events.push({
    type: "created",
    authorName: planCreatedByName,
    timestamp: planCreatedAt,
  });

  events.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div>
      <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-3">
        Activity
      </div>
      {events.map((event, i) => (
        <TimelineEntry key={i} {...event} />
      ))}
    </div>
  );
}
