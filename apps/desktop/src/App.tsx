import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { FullScreenSpinner } from "./components/FullScreenSpinner";
import { useAuth } from "./lib/AuthContext";
import { BelegungPage } from "./pages/BelegungPage";
import { LoginPage } from "./pages/LoginPage";
import { UnsupportedRolePage } from "./pages/UnsupportedRolePage";

export function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  if (user.role !== "BETREIBER") {
    return <UnsupportedRolePage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<BelegungPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
