export function GoogleSignInButton({ onClick, loading }) {
  return (
    <button className="primary-button google-auth-button" type="button" onClick={onClick} disabled={loading}>
      {loading ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
