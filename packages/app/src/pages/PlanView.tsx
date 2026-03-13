import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatusBadge } from "../components/plans/StatusBadge";
import { VersionSwitcher } from "../components/plans/VersionSwitcher";
import { PlanContent } from "../components/plans/PlanContent";
import { ReviewTimeline } from "../components/timeline/ReviewTimeline";
import { ReviewModal } from "../components/plans/ReviewModal";
import { ReviewRequestModal } from "../components/plans/ReviewRequestModal";

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);
  return { message, show };
}

export function PlanView() {
  const { folderSlug, planSlug } = useParams();
  const plan = useQuery(api.plans.getBySlug, { slug: planSlug! });
  const versions = useQuery(
    api.planVersions.listByPlan,
    plan ? { planId: plan._id } : "skip"
  ) as Array<{ _id: string; version: number; pushedAt: number; changeNote?: string; htmlContent: string; markdownContent: string; planId: string; pushedBy: string }> | undefined;
  const users = useQuery(api.users.list, {}) as Array<{ _id: string; name: string }> | undefined;

  const me = useQuery(api.users.me, {}) as { _id: string } | null | undefined;
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "changes_requested" | null>(null);
  const [showReviewRequest, setShowReviewRequest] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const currentVersion = versions?.find(
    (v) => v._id === (selectedVersionId ?? plan?.currentVersionId)
  );

  const updateStatus = useMutation(api.plans.updateStatus);
  const submitReview = useMutation(api.reviews.submit);

  const createdBy = (plan as any)?.createdBy;
  const creatorName = createdBy
    ? (users?.find((u) => u._id === createdBy)?.name ?? "Unknown")
    : "CLI";

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
                onClick={() => setShowReviewRequest(true)}
                className="px-3 py-1 bg-[var(--plan-accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity"
              >
                Request Review
              </button>
            )}
            {plan.status === "in_review" && (
              <>
                <button
                  onClick={() => setReviewAction("approved")}
                  className="px-3 py-1 bg-[var(--plan-success)] text-white text-xs rounded-md hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  onClick={() => setReviewAction("changes_requested")}
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
            planCreatedByName={creatorName}
            reviewRequestedAt={(plan as any).reviewRequestedAt}
            reviewRequestedBy={(plan as any).reviewRequestedBy}
            requestedReviewers={(plan as any).requestedReviewers}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--plan-border-subtle)]">
          <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-2">
            Actions
          </div>
          <button
            onClick={async () => {
              if (currentVersion) {
                await navigator.clipboard.writeText((currentVersion as any).markdownContent);
                toast.show("Copied markdown!");
              }
            }}
            className="w-full text-left px-2 py-2 text-sm text-[var(--plan-text-primary)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors cursor-pointer"
          >
            Copy for Linear
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.show("Link copied!");
            }}
            className="w-full text-left px-2 py-2 mt-2 text-sm text-[var(--plan-text-primary)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors cursor-pointer"
          >
            Copy Link
          </button>
        </div>
      </div>
      {/* Toast notification */}
      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--plan-text-heading)] text-[var(--plan-bg)] px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}
      {showReviewRequest && me && (
        <ReviewRequestModal
          planId={plan._id}
          currentUserId={me._id}
          onClose={() => setShowReviewRequest(false)}
          onSubmitted={() => setShowReviewRequest(false)}
        />
      )}
      {reviewAction && currentVersion && (
        <ReviewModal
          action={reviewAction}
          onSubmit={async (note) => {
            setBusy(true);
            await submitReview({
              planId: plan._id as any,
              versionId: currentVersion._id as any,
              action: reviewAction,
              note: note || undefined,
            });
            setBusy(false);
            setReviewAction(null);
          }}
          onClose={() => setReviewAction(null)}
        />
      )}
    </div>
  );
}
