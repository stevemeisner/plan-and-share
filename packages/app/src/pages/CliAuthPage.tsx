import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";

type AuthState = "confirm" | "authorizing" | "success" | "error";

export function CliAuthPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("session");
  const approveSession = useMutation(api.cliAuth.approveSession);
  const [state, setState] = useState<AuthState>("confirm");
  const [error, setError] = useState<string | null>(null);

  if (!code) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-[var(--plan-text-heading)]">
          CLI Authorization
        </h1>
        <p className="text-[var(--plan-danger)] mt-2">
          Missing authorization code. Please run <code>plan-push login</code>{" "}
          again.
        </p>
      </div>
    );
  }

  const handleAuthorize = async () => {
    setState("authorizing");
    try {
      await approveSession({ code });
      setState("success");
    } catch (e: any) {
      setState("error");
      setError(e.message ?? "Authorization failed");
    }
  };

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold text-[var(--plan-text-heading)] mb-6">
        CLI Authorization
      </h1>

      {state === "confirm" && (
        <div>
          <p className="text-[var(--plan-text-secondary)] mb-4">
            A CLI session is requesting access to your account. Verify the code
            below matches what you see in your terminal:
          </p>
          <div className="bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-lg p-6 mb-6 text-center">
            <span className="font-mono text-3xl tracking-[0.3em] font-bold text-[var(--plan-text-heading)]">
              {code}
            </span>
          </div>
          <button
            onClick={handleAuthorize}
            className="w-full px-6 py-3 bg-[var(--plan-accent)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Authorize this CLI session
          </button>
        </div>
      )}

      {state === "authorizing" && (
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-[var(--plan-accent)] border-t-transparent rounded-full" />
          <span className="text-[var(--plan-text-secondary)]">
            Authorizing...
          </span>
        </div>
      )}

      {state === "success" && (
        <div>
          <p className="text-[var(--plan-success, green)] font-medium mb-2">
            CLI session authorized successfully.
          </p>
          <p className="text-[var(--plan-text-secondary)]">
            You can close this tab and return to your terminal.
          </p>
        </div>
      )}

      {state === "error" && (
        <div>
          <p className="text-[var(--plan-danger)] font-medium mb-2">
            Authorization failed
          </p>
          <p className="text-[var(--plan-text-secondary)] mb-4">{error}</p>
          <button
            onClick={() => setState("confirm")}
            className="px-4 py-2 bg-[var(--plan-bg-secondary)] border border-[var(--plan-border)] rounded-lg text-[var(--plan-text-primary)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
