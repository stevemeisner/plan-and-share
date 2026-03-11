import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function AdminUsers() {
  const me = useQuery(api.users.me, {});
  const users = useQuery(api.users.list, {});
  const invites = useQuery(api.invites.list, {});
  const createInvite = useMutation(api.invites.create);
  const [email, setEmail] = useState("");

  if (me?.role !== "admin") {
    return (
      <div className="p-8 text-[var(--plan-text-muted)]">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-[var(--plan-text-heading)] mb-6">
        User Management
      </h1>

      {/* Invite form */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Invite User
        </h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="flex-1 bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-md px-3 py-2 text-sm text-[var(--plan-text-primary)] focus:outline-none focus:border-[var(--plan-accent)]"
          />
          <button
            onClick={async () => {
              if (email.trim()) {
                await createInvite({ email: email.trim() });
                setEmail("");
              }
            }}
            className="px-4 py-2 text-sm bg-[var(--plan-accent)] text-white rounded-md hover:opacity-90"
          >
            Send Invite
          </button>
        </div>
      </div>

      {/* Active users */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Active Users ({users?.length ?? 0})
        </h2>
        <div className="border border-[var(--plan-border)] rounded-lg overflow-hidden">
          {users?.map((user: any) => (
            <div
              key={user._id}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--plan-border-subtle)] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--plan-accent)] flex items-center justify-center text-white text-xs font-semibold">
                  {user.name[0]}
                </div>
                <div>
                  <div className="text-sm text-[var(--plan-text-heading)]">{user.name}</div>
                  <div className="text-xs text-[var(--plan-text-muted)]">{user.email}</div>
                </div>
              </div>
              <span className="text-xs text-[var(--plan-text-muted)] capitalize">
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      <div>
        <h2 className="text-sm font-medium text-[var(--plan-text-heading)] mb-2">
          Pending Invites
        </h2>
        <div className="border border-[var(--plan-border)] rounded-lg overflow-hidden">
          {invites?.filter((i: any) => !i.acceptedAt).map((invite: any) => (
            <div
              key={invite._id}
              className="flex items-center justify-between px-4 py-3 border-b border-[var(--plan-border-subtle)] last:border-b-0"
            >
              <span className="text-sm text-[var(--plan-text-primary)]">{invite.email}</span>
              <span className="text-xs text-[var(--plan-text-muted)]">
                Invited {new Date(invite.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {(!invites || invites.filter((i: any) => !i.acceptedAt).length === 0) && (
            <div className="px-4 py-3 text-sm text-[var(--plan-text-muted)]">
              No pending invites.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
