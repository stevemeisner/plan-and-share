interface VersionSwitcherProps {
  versions: Array<{ _id: string; version: number }>;
  currentVersionId: string;
  onVersionChange: (versionId: string) => void;
}

export function VersionSwitcher({
  versions,
  currentVersionId,
  onVersionChange,
}: VersionSwitcherProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const maxVersion = Math.max(...versions.map((v) => v.version));

  return (
    <select
      value={currentVersionId}
      onChange={(e) => onVersionChange(e.target.value)}
      className="bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md px-2 py-1 text-xs text-[var(--plan-text-primary)]"
    >
      {sorted.map((v) => (
        <option key={v._id} value={v._id}>
          v{v.version}{v.version === maxVersion ? " (current)" : ""}
        </option>
      ))}
    </select>
  );
}
