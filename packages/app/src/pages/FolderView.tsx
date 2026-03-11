import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { PlanCard } from "../components/plans/PlanCard";

export function FolderView() {
  const { folderSlug } = useParams<{ folderSlug: string }>();
  const folders = useQuery(api.folders.list, {});
  const folder = folders?.find((f: any) => f.slug === folderSlug);

  const plans = useQuery(
    api.plans.listByFolder,
    folder ? { folderId: folder._id } : "skip"
  );

  if (!folder) {
    return (
      <div className="p-8 text-[var(--plan-text-muted)]">
        Folder not found.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--plan-text-heading)]">
          {folder.name}
        </h1>
        {folder.description && (
          <p className="text-[var(--plan-text-secondary)] mt-1">
            {folder.description}
          </p>
        )}
        <p className="text-sm text-[var(--plan-text-muted)] mt-1">
          {plans?.length ?? 0} plans
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {plans?.map((plan: any) => (
          <PlanCard key={plan._id} plan={plan} folderSlug={folderSlug!} />
        ))}
        {plans?.length === 0 && (
          <p className="text-[var(--plan-text-muted)] text-sm">
            No plans in this folder yet. Push one with the CLI.
          </p>
        )}
      </div>
    </div>
  );
}
