export function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("planshare-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("planshare-theme", theme);
}

export function toggleTheme(): "light" | "dark" {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
