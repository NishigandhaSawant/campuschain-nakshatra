"use client";

import { useState } from "react";
import Link from "next/link";
import { submitUniversityRequest } from "@/lib/store";

export default function RequestCampusPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [collegeName, setCollegeName] = useState("");
  const [collegeDomain, setCollegeDomain] = useState("");
  const [collegeWebsite, setCollegeWebsite] = useState("");
  const [collegePhone, setCollegePhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!collegeName.trim() || !collegeDomain.trim() || !collegeWebsite.trim() || !collegePhone.trim()) {
      setError("Please fill in all college details.");
      return;
    }
    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setError("Please fill in all admin details.");
      return;
    }
    if (adminPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const result = submitUniversityRequest(
      collegeName.trim(),
      collegeDomain.trim(),
      collegeWebsite.trim(),
      collegePhone.trim(),
      adminName.trim(),
      adminEmail.trim(),
      adminPassword
    );

    if (!result.success) {
      setError(result.error || "Submission failed.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-success/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="w-full max-w-lg z-10 animate-fade-in text-center">
          <div className="glass-card p-10">
            <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Request Submitted!</h2>
            <p className="text-muted text-sm mb-2">
              Your campus registration request for <strong className="text-white">{collegeName}</strong> has been 
              sent to the CampusChain Super Admin for verification.
            </p>
            <p className="text-muted text-sm mb-8">
              Once approved, you will be able to log in as a Campus Admin using the credentials you provided.
            </p>

            <div className="glass-card p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted text-xs">College</span>
                  <div className="text-white mt-0.5">{collegeName}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Domain</span>
                  <div className="text-secondary-light mt-0.5">{collegeDomain.startsWith("@") ? collegeDomain : `@${collegeDomain}`}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Admin Email</span>
                  <div className="text-white mt-0.5">{adminEmail}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Status</span>
                  <div className="mt-0.5"><span className="badge badge-unused">Pending Review</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/login" className="btn-primary">
                Go to Login →
              </Link>
              <Link href="/" className="btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl z-10 animate-fade-in">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CampusChain</span>
        </Link>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
            step === 1 ? "bg-primary/20 text-white border border-primary/30" : "bg-white/5 text-muted"
          }`}>
            <span>🏫</span> College Details
          </div>
          <div className="w-8 h-0.5 bg-white/10 rounded" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
            step === 2 ? "bg-primary/20 text-white border border-primary/30" : "bg-white/5 text-muted"
          }`}>
            <span>👤</span> Admin Account
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? "Register Your Campus" : "Create Admin Account"}
            </h2>
            <p className="text-muted text-sm mt-1">
              {step === 1
                ? "Fill in your institution details. This will be verified by our Super Admin."
                : "Set up your Campus Admin credentials for managing license keys."}
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setError(""); setStep(2); } : handleSubmit}>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2">College / University Name *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. A.P. Shah Institute of Technology"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Email Domain *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. @apsit.edu.in"
                    value={collegeDomain}
                    onChange={(e) => setCollegeDomain(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Phone Number *</label>
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="e.g. +91-22-28082724"
                    value={collegePhone}
                    onChange={(e) => setCollegePhone(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2">College Website *</label>
                  <input
                    className="input-field"
                    type="url"
                    placeholder="e.g. https://www.apsit.edu.in"
                    value={collegeWebsite}
                    onChange={(e) => setCollegeWebsite(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="submit" className="btn-primary w-full text-center">
                    Continue to Admin Setup →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2">Your Full Name *</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2">Admin Email *</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="e.g. admin@apsit.edu.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Create Password *</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Min 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Confirm Password *</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Preview Card */}
                <div className="md:col-span-2 glass-card p-4 my-2">
                  <div className="text-xs text-muted mb-2 font-semibold">📋 Request Preview</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted">College:</span> <span className="text-white">{collegeName}</span></div>
                    <div><span className="text-muted">Domain:</span> <span className="text-secondary-light">{collegeDomain.startsWith("@") ? collegeDomain : `@${collegeDomain}`}</span></div>
                    <div><span className="text-muted">Website:</span> <span className="text-white">{collegeWebsite}</span></div>
                    <div><span className="text-muted">Phone:</span> <span className="text-white">{collegePhone}</span></div>
                  </div>
                </div>

                {error && (
                  <div className="md:col-span-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
                    ⚠️ {error}
                  </div>
                )}

                <div className="md:col-span-2 flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 text-center">
                    ← Back
                  </button>
                  <button type="submit" className="btn-primary flex-1 text-center">
                    Submit Request for Approval
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <Link href="/login" className="text-muted text-sm hover:text-white transition-colors block">
            Already have an account? Sign In →
          </Link>
          <Link href="/" className="text-muted text-sm hover:text-white transition-colors block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
