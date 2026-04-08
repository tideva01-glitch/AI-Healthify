import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { OnboardingPage } from "./pages/OnboardingPage.jsx";

function AppBody() {
  const { user, loading, ready } = useAuth();

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <p className="eyebrow">Loading your nutrition workspace</p>
          <h1>Preparing your dashboard</h1>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <p className="eyebrow">Supabase setup needed</p>
          <h1>Add your Supabase URL and anon key to start the app.</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!user.profileComplete) {
    return <OnboardingPage />;
  }

  return <DashboardPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppBody />
    </AuthProvider>
  );
}
