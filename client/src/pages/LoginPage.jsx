import { useState } from "react";
import { GoogleSignInButton } from "../components/GoogleSignInButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">India-first wellness tracker</p>
          <h1>Track what you eat, detect gaps early, and improve tomorrow&apos;s meals.</h1>
          <p className="lead">
            Log meals with text and photos. The app estimates calories, vitamins, and minerals, then turns the day into clear food guidance.
          </p>
          <ul className="feature-strip">
            <li>AI-assisted meal detection</li>
            <li>Daily nutrient gap feedback</li>
            <li>Rolling 90-day history</li>
          </ul>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Start your account</p>
          <h2>Sign in to begin logging meals</h2>
          <GoogleSignInButton onClick={handleLogin} loading={loading} />
          {loading ? <p className="hint-text">Redirecting to Supabase Google sign-in...</p> : null}
          {error ? <div className="error-box">{error}</div> : null}
          <p className="disclaimer">
            Nutrition estimates are for wellness support only and should not replace medical advice.
          </p>
        </div>
      </section>
    </div>
  );
}
