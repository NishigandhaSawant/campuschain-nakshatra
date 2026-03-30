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
        <div className="w-full max-w-lg z-10 animate-fade-in text-center">
          <div className="glass-card p-10">
            <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-success">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Request Submitted!</h2>
            <p className="text-muted text-sm mb-2">
              Your campus registration request for <strong className="text-white">{collegeName}</strong> has been
              sent to the CampusChain Super Admin for verification.
            </p>
            <p className="text-zinc-500 text-sm mb-8">
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
                  <div className="text-white mt-0.5 font-medium">{collegeDomain.startsWith("@") ? collegeDomain : `@${collegeDomain}`}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Admin Email</span>
                  <div className="text-white mt-0.5">{adminEmail}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Status</span>
                  <div className="mt-0.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-white/5 uppercase tracking-wider">Pending Review</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/login" className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all text-sm">
                Go to Login →
              </Link>
              <Link href="/" className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-medium border border-white/5 hover:bg-white/10 transition-all text-sm">
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
      <div className="w-full max-w-2xl z-10 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105">
            C
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">CampusChain</span>
        </Link>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${step === 1 ? "bg-white text-black" : "bg-white/5 text-zinc-500"}`}>
            <span>🏫</span> Institution Details
          </div>
          <div className="w-8 h-0.5 bg-white/10 rounded" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${step === 2 ? "bg-white text-black" : "bg-white/5 text-zinc-500"}`}>
            <span>👤</span> Admin Account
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {step === 1 ? "Partner Registration" : "Setup Campus Admin"}
            </h2>
            <p className="text-muted text-sm mt-1">
              {step === 1
                ? "Register your institution on the CampusChain network."
                : "Create your primary administrative credentials."}
            </p>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setError(""); setStep(2); } : handleSubmit}>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2 font-medium">Institution Name *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    placeholder="e.g. A.P. Shah Institute of Technology"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2 font-medium">Email Domain *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    placeholder="e.g. @apsit.edu.in"
                    value={collegeDomain}
                    onChange={(e) => setCollegeDomain(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2 font-medium">Phone Number *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    type="tel"
                    placeholder="Official Contact"
                    value={collegePhone}
                    onChange={(e) => setCollegePhone(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2 font-medium">Institution Website *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    type="url"
                    placeholder="https://example.edu.in"
                    value={collegeWebsite}
                    onChange={(e) => setCollegeWebsite(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2 mt-4">
                  <button type="submit" className="w-full py-3.5 rounded-xl bg-white text-black font-bold border border-white hover:bg-zinc-200 transition-all text-sm">
                    Continue to Admin Setup →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2 font-medium">Full Name (Superintendent/Dean) *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-muted block mb-2 font-medium">Admin Email Address *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    type="email"
                    placeholder="dean@institution.edu.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2 font-medium">Create Password *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    type="password"
                    placeholder="Min 6 characters"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2 font-medium">Confirm Password *</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                    type="password"
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="md:col-span-2 text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-xl p-3">
                    ⚠️ {error}
                  </div>
                )}

                <div className="md:col-span-2 flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl bg-white/5 text-white font-bold border border-white/5 hover:bg-white/10 transition-all text-sm">
                    ← Back
                  </button>
                  <button type="submit" className="flex-1 py-3.5 rounded-xl bg-white text-black font-bold border border-white hover:bg-zinc-200 transition-all text-sm">
                    Submit Application
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="text-center mt-8 space-y-3">
          <Link href="/login" className="text-muted text-xs hover:text-white transition-colors block">
            Partner portal login →
          </Link>
          <Link href="/" className="text-muted text-[10px] hover:text-white transition-colors block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
