import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--plan-bg)]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--plan-accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function LoginPage() {
  const { signIn } = useAuthActions();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const redirectTo = location.pathname + location.search;
      await signIn("google", { redirectTo });
    } catch (e) {
      setError("Sign-in failed. Please try again.");
      setSigningIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--plan-bg)]">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="bg-[var(--plan-accent)] text-white w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold">P</span>
          <h1 className="text-2xl font-semibold text-[var(--plan-text-heading)]">PlanShare</h1>
        </div>
        <p className="text-[var(--plan-text-secondary)] mb-8">Sign in to view and review plans.</p>
        {error && (
          <p className="text-[var(--plan-danger)] text-sm mb-4">{error}</p>
        )}
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="px-6 py-3 bg-[var(--plan-text-heading)] text-[var(--plan-bg)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-wait"
        >
          {signingIn ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
