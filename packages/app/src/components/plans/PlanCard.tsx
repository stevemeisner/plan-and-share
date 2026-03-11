import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";

interface PlanCardProps {
  plan: {
    _id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: number;
  };
  folderSlug: string;
}

export function PlanCard({ plan, folderSlug }: PlanCardProps) {
  return (
    <Link
      to={`/f/${folderSlug}/${plan.slug}`}
      className={`block bg-[var(--plan-bg-secondary)] border border-[var(--plan-border-subtle)] rounded-lg p-4 hover:border-[var(--plan-border)] transition-colors ${
        plan.status === "draft" ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[var(--plan-text-heading)] font-medium">
            {plan.title}
          </h3>
          <p className="text-xs text-[var(--plan-text-muted)] mt-1">
            {new Date(plan.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={plan.status} />
      </div>
    </Link>
  );
}
