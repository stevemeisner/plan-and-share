import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../../convex/_generated/api";
import { Link, useParams } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

type Folder = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

type User = {
  name?: string;
  avatarUrl?: string;
  role?: string;
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const folders = useQuery(api.folders.list, {}) as Folder[] | undefined;
  const me = useQuery(api.users.me, {}) as User | null | undefined;
  const { folderSlug } = useParams();
  const { signOut } = useAuthActions();

  return (
    <aside
      className="w-[var(--sidebar-width)] bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col h-screen"
    >
      {/* Logo */}
      <div className="p-4 border-b border-[var(--sidebar-border)] flex items-center justify-between">
        <Link to="/" className="text-[var(--plan-text-heading)] font-semibold text-lg flex items-center gap-2">
          <span className="bg-[var(--plan-accent)] text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold">P</span>
          PlanShare
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded hover:bg-[var(--plan-bg-hover)]"
          aria-label="Close sidebar"
        >
          ✕
        </button>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="px-3 py-2 text-[var(--plan-text-muted)] text-xs uppercase tracking-wider">
          Folders
        </div>
        {folders?.map((folder) => (
          <Link
            key={folder._id}
            to={`/f/${folder.slug}`}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              folderSlug === folder.slug
                ? "bg-[var(--plan-bg-hover)] text-[var(--plan-text-heading)]"
                : "text-[var(--plan-text-secondary)] hover:bg-[var(--plan-bg-hover)]"
            }`}
          >
            {folder.name}
          </Link>
        ))}
        {me?.role === "admin" && (
          <Link
            to="/admin/users"
            className="block px-3 py-2 mt-2 rounded-md text-sm text-[var(--plan-text-secondary)] hover:bg-[var(--plan-bg-hover)] border-t border-[var(--sidebar-border)] pt-3"
          >
            User Management
          </Link>
        )}
      </nav>

      {/* User + theme toggle */}
      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} className="w-7 h-7 rounded-full" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[var(--plan-accent)] flex items-center justify-center text-white text-xs font-semibold">
                {me?.name?.[0] ?? "?"}
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--plan-text-heading)]">{me?.name}</div>
              <div className="text-xs text-[var(--plan-text-muted)]">{me?.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="p-2 rounded-md text-[var(--plan-text-muted)] hover:bg-[var(--plan-bg-hover)] hover:text-[var(--plan-text-primary)] transition-colors text-xs"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
