"use client";

import { useState } from "react";
import Link from "next/link";
import { registerPendingStudent, DEPARTMENTS, Department } from "@/lib/store";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState<Department>("Computer Science");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = registerPendingStudent(name.trim(), email.trim(), password, department);
      if (!result.success) {
        setError(result.error || "Registration failed.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
    }, 800);
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
            <h2 className="text-2xl font-bold text-white mb-3">Registration Submitted!</h2>
            <p className="text-muted text-sm mb-2">
              Your account has been created and is now <strong className="text-white">pending approval</strong> from your Campus Admin.
            </p>
            <p className="text-muted text-sm mb-8">
              Once approved, you will receive a <span className="text-secondary-light font-semibold">License Key</span> which you&apos;ll use to activate your CampusChain wallet and blockchain features.
            </p>

            <div className="glass-card p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted text-xs">Name</span>
                  <div className="text-white mt-0.5">{name}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Email</span>
                  <div className="text-white mt-0.5">{email}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Department</span>
                  <div className="text-secondary-light mt-0.5">{department}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Status</span>
                  <div className="mt-0.5"><span className="badge badge-unused">Pending Approval</span></div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 text-left mb-6 border-l-2 border-primary/50">
              <h4 className="text-sm font-semibold text-white mb-2">📋 What happens next?</h4>
              <ol className="text-xs text-muted space-y-1.5 list-decimal list-inside">
                <li>Your Campus Admin will verify your college email domain</li>
                <li>Once approved, a <span className="text-secondary-light">License Key</span> will be generated for you</li>
                <li>Your admin will securely share the key with you</li>
                <li>Login and enter your key to unlock your Web3 wallet & $CAMPUS tokens</li>
              </ol>
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-fade-in">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CampusChain</span>
        </Link>

        <div className="glass-card p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-3xl mb-3">🎓</div>
            <h2 className="text-xl font-bold text-white">Student Registration</h2>
            <p className="text-muted text-sm mt-1">
              Create your CampusChain account. Your Campus Admin will verify and approve your registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted block mb-2">Full Name *</label>
              <input
                className="input-field"
                placeholder="e.g. Jagdish Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-2">College Email *</label>
              <input
                className="input-field"
                type="email"
                placeholder="e.g. student@apsit.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted mt-1.5 ml-1">
                Must use your official college domain email (e.g. @apsit.edu.in)
              </p>
            </div>

            <div>
              <label className="text-xs text-muted block mb-2">Department *</label>
              <select
                className="select-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-2">Password *</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-2">Confirm Password *</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Re-enter"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full text-center flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Registering...
                </>
              ) : (
                <>Create Account →</>
              )}
            </button>
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
