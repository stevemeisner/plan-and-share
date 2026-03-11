import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed z-50 lg:static lg:block shrink-0 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-[var(--plan-border-subtle)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-[var(--plan-bg-hover)]"
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <span className="font-semibold text-[var(--plan-text-heading)]">PlanShare</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
