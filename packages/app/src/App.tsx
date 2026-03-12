import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./lib/auth";
import { Shell } from "./components/layout/Shell";
import { FolderView } from "./pages/FolderView";
import { PlanView } from "./pages/PlanView";
import { AdminUsers } from "./pages/AdminUsers";
import { CliAuthPage } from "./pages/CliAuthPage";

function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-[var(--plan-text-heading)]">
        Welcome to PlanShare
      </h1>
      <p className="text-[var(--plan-text-secondary)] mt-2">
        Select a folder from the sidebar to view plans.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/f/:folderSlug" element={<FolderView />} />
            <Route path="/f/:folderSlug/:planSlug" element={<PlanView />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/cli-auth" element={<CliAuthPage />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
