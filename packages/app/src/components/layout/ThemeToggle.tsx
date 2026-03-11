import { useState } from "react";
import { toggleTheme, getInitialTheme } from "../../lib/theme";

export function ThemeToggle() {
  const [theme, setThemeState] = useState(getInitialTheme);

  return (
    <button
      onClick={() => setThemeState(toggleTheme())}
      className="p-2 rounded-md hover:bg-[var(--plan-bg-hover)] transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
