import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatusBadge } from "../components/plans/StatusBadge";
import { VersionSwitcher } from "../components/plans/VersionSwitcher";
import { PlanContent } from "../components/plans/PlanContent";
import { ReviewTimeline } from "../components/timeline/ReviewTimeline";

export function PlanView() {
  const { folderSlug, planSlug } = useParams();
  const plan = useQuery(api.plans.getBySlug, { slug: planSlug! });
  const versions = useQuery(
    api.planVersions.listByPlan,
    plan ? { planId: plan._id } : "skip"
  ) as Array<{ _id: string; version: number; pushedAt: number; changeNote?: string; htmlContent: string; markdownContent: string; planId: string; pushedBy: string }> | undefined;

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const currentVersion = versions?.find(
    (v) => v._id === (selectedVersionId ?? plan?.currentVersionId)
  );

  const updateStatus = useMutation(api.plans.updateStatus);

  if (!plan) {
    return <div className="p-8 text-[var(--plan-text-muted)]">Plan not found.</div>;
  }

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 max-w-[var(--plan-content-width)] mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--plan-border-subtle)]">
          <Link
            to={`/f/${folderSlug}`}
            className="text-xs text-[var(--plan-accent)] hover:underline"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            {versions && versions.length > 0 && (
              <VersionSwitcher
                versions={versions}
                currentVersionId={selectedVersionId ?? plan.currentVersionId ?? ""}
                onVersionChange={setSelectedVersionId}
              />
            )}
            <StatusBadge status={plan.status} />
            {plan.status === "draft" && (
              <button
                onClick={() =>
                  updateStatus({ planId: plan._id, status: "in_review" })
                }
                className="px-3 py-1 bg-[var(--plan-accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity"
              >
                Request Review
              </button>
            )}
            {plan.status === "in_review" && (
              <>
                <button
                  onClick={() => {
                    // Will trigger review modal — implemented in Chunk 6
                  }}
                  className="px-3 py-1 bg-[var(--plan-success)] text-white text-xs rounded-md hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    // Will trigger review modal — implemented in Chunk 6
                  }}
                  className="px-3 py-1 border border-[var(--plan-danger)] text-[var(--plan-danger)] text-xs rounded-md hover:bg-[var(--plan-danger-bg)]"
                >
                  Request Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Plan content */}
        {currentVersion && (
          <>
            <h1 className="text-2xl font-semibold text-[var(--plan-text-heading)] mb-1">
              {plan.title}
            </h1>
            <p className="text-xs text-[var(--plan-text-muted)] mb-6">
              v{currentVersion.version} · {new Date(currentVersion.pushedAt).toLocaleDateString()}
              {currentVersion.changeNote && ` · ${currentVersion.changeNote}`}
            </p>
            <PlanContent htmlContent={currentVersion.htmlContent} planId={plan._id} versionId={currentVersion._id} />
          </>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-56 border-l border-[var(--plan-border-subtle)] bg-[var(--plan-bg-secondary)] p-4 hidden lg:block">
        <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-2">
          Versions
        </div>
        {versions?.sort((a, b) => b.version - a.version).map((v) => (
          <button
            key={v._id}
            onClick={() => setSelectedVersionId(v._id)}
            className={`block w-full text-left text-sm px-2 py-1 rounded ${
              v._id === (selectedVersionId ?? plan.currentVersionId)
                ? "text-[var(--plan-accent)]"
                : "text-[var(--plan-text-muted)] hover:text-[var(--plan-text-primary)]"
            }`}
          >
            v{v.version}
            {v._id === plan.currentVersionId ? " — current" : ""}
          </button>
        ))}
        <div className="mt-6">
          <ReviewTimeline
            planId={plan._id}
            planCreatedAt={(plan as any).createdAt}
            planCreatedByName="Author"
          />
        </div>
      </div>
    </div>
  );
}
