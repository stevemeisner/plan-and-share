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
import { CommentPanel } from "../components/comments/CommentPanel";
import { ConfirmDialog } from "../components/plans/ConfirmDialog";

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
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "plan" | "version"; versionId?: string } | null>(null);
  const toast = useToast();

  const currentVersion = versions?.find(
    (v) => v._id === (selectedVersionId ?? plan?.currentVersionId)
  );

  const comments = useQuery(
    api.comments.listByVersion,
    currentVersion ? { versionId: currentVersion._id as any } : "skip"
  ) ?? [];

  const updateStatus = useMutation(api.plans.updateStatus);
  const submitReview = useMutation(api.reviews.submit);
  const deletePlanMut = useMutation(api.plans.deletePlan);
  const deleteVersionMut = useMutation(api.planVersions.deleteVersion);

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
            className="inline-flex items-center gap-1 text-sm text-[var(--plan-text-secondary)] hover:text-[var(--plan-text-heading)] hover:bg-[var(--plan-bg-hover)] px-2 py-1 rounded-md transition-colors"
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
            <PlanContent
              htmlContent={currentVersion.htmlContent}
              planId={plan._id}
              versionId={currentVersion._id}
              comments={comments as any}
              onSelectParagraph={setActiveParagraphId}
              activeParagraphId={activeParagraphId}
            />
          </>
        )}
      </div>

      {/* Right sidebar: single container with cross-fade between versions and comments */}
      <div className={`
        hidden lg:block sticky top-0 h-screen relative overflow-hidden
        border-l border-[var(--plan-border-subtle)] bg-[var(--plan-bg-secondary)]
        transition-[width] duration-200 ease-in-out
        ${activeParagraphId ? 'w-80' : 'w-56'}
      `}>
        {/* Versions panel — fades out when comments active */}
        <div className={`
          absolute inset-0 p-4 overflow-y-auto
          transition-opacity duration-150
          ${activeParagraphId ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}>
          <div className="text-xs text-[var(--plan-text-muted)] uppercase tracking-wider mb-2">
            Versions
          </div>
          {versions?.sort((a, b) => b.version - a.version).map((v) => (
            <div key={v._id} className="group flex items-center">
              <button
                onClick={() => setSelectedVersionId(v._id)}
                className={`flex-1 text-left text-sm px-2 py-1 rounded ${
                  v._id === (selectedVersionId ?? plan.currentVersionId)
                    ? "text-[var(--plan-accent)]"
                    : "text-[var(--plan-text-muted)] hover:text-[var(--plan-text-primary)]"
                }`}
              >
                v{v.version}
                {v._id === plan.currentVersionId ? " — current" : ""}
              </button>
              {(plan as any).createdBy === me?._id && (
                <button
                  onClick={() => setConfirmDelete({ type: "version", versionId: v._id })}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--plan-text-muted)] hover:text-[var(--plan-danger)] transition-opacity"
                  aria-label={`Delete version ${v.version}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A1.75 1.75 0 0 0 9.25 1.5h-2.5A1.75 1.75 0 0 0 5 3.25Zm2.5-.75a.25.25 0 0 0-.25.25V4h1.5v-.75a.25.25 0 0 0-.25-.25h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
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
            {(plan as any).createdBy === me?._id && (
              <button
                onClick={() => setConfirmDelete({ type: "plan" })}
                className="w-full text-left px-2 py-2 mt-2 text-sm text-[var(--plan-danger)] bg-[var(--plan-bg)] border border-[var(--plan-border)] rounded-md hover:bg-[var(--plan-danger-bg)] transition-colors cursor-pointer"
              >
                Delete Plan
              </button>
            )}
          </div>
        </div>

        {/* Comment panel — fades in when comments active */}
        <div className={`
          absolute inset-0
          transition-opacity duration-150
          ${activeParagraphId ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          {activeParagraphId && currentVersion && (
            <CommentPanel
              planId={plan._id}
              versionId={currentVersion._id}
              paragraphId={activeParagraphId}
              comments={comments as any}
              onClose={() => setActiveParagraphId(null)}
            />
          )}
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
      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === "plan" ? "Delete Plan" : "Delete Version"}
          message={
            confirmDelete.type === "plan"
              ? `Delete "${plan.title}"? This will hide it from the folder. This can't be undone.`
              : `Delete this version? ${versions && versions.length <= 1 ? "This is the only version — the entire plan will be deleted." : "This can't be undone."}`
          }
          confirmLabel="Delete"
          onConfirm={async () => {
            if (confirmDelete.type === "plan") {
              await deletePlanMut({ planId: plan._id as any });
              setConfirmDelete(null);
              window.history.back();
            } else if (confirmDelete.versionId) {
              const isLastVersion = versions && versions.length <= 1;
              await deleteVersionMut({ versionId: confirmDelete.versionId as any });
              setConfirmDelete(null);
              if (isLastVersion) {
                window.history.back();
              }
            }
          }}
          onCancel={() => setConfirmDelete(null)}
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
