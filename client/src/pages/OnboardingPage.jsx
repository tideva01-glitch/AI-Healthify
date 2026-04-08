import { useState } from "react";
import { ProfileForm } from "../components/ProfileForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function OnboardingPage() {
  const { user, saveProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(profile) {
    setSaving(true);
    try {
      await saveProfile(profile);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hero-shell">
      <section className="hero-panel onboarding-panel">
        <div className="hero-copy">
          <p className="eyebrow">Welcome, {user?.name}</p>
          <h1>Set up your nutrition baseline</h1>
          <p className="lead">
            These details help estimate calorie needs and daily nutrient targets, so the feedback is personal instead of generic.
          </p>
        </div>
        <div className="hero-card wide-card">
          <p className="eyebrow">Profile details</p>
          <h2>Complete your account</h2>
          <ProfileForm initialValues={user} onSubmit={handleSubmit} submitting={saving} />
        </div>
      </section>
    </div>
  );
}
