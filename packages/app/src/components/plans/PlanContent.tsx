interface PlanContentProps {
  htmlContent: string;
}

export function PlanContent({ htmlContent }: PlanContentProps) {
  return (
    <article
      className="plan-content prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
