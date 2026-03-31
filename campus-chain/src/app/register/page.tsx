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
        <div className="w-full max-w-lg z-10 animate-fade-in text-center">
          <div className="glass-card p-10">
            <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl text-green-500">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Registration Submitted!</h2>
            <p className="text-muted text-sm mb-2">
              Your account has been created and is now <strong className="text-white">pending approval</strong> from your Campus Admin.
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              Once approved, you will receive a <span className="text-white font-semibold">License Key</span> which you&apos;ll use to activate your CampusChain wallet.
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
                  <div className="text-white mt-0.5">{department}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Status</span>
                  <div className="mt-0.5"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-yellow-500 border border-white/5 uppercase tracking-wider">Pending Approval</span></div>
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
      <div className="w-full max-w-lg z-10 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105">
            C
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">CampusChain</span>
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
              <label className="text-xs text-muted block mb-2 font-medium">Full Name *</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                placeholder="e.g. Jagdish Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-muted block mb-2 font-medium">College Email *</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                type="email"
                placeholder="e.g. student@apsit.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-[11px] text-zinc-500 mt-2 ml-1">
                Must use your official college domain email (e.g. @apsit.edu.in)
              </p>
            </div>

            <div>
              <label className="text-xs text-muted block mb-2 font-medium">Department *</label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm appearance-none cursor-pointer"
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-zinc-950 text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-2 font-medium">Password *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                  type="password"
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-2 font-medium">Confirm Password *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                  type="password"
                  placeholder="Re-enter"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-xl p-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white text-black font-bold border border-white hover:bg-zinc-200 transition-all text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-4 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Create Account →"}
            </button>
          </form>

          <div className="text-center mt-8 space-y-3">
            <Link href="/login" className="text-muted text-xs hover:text-white transition-colors block">
              Already have an account? Sign In →
            </Link>
            <Link href="/" className="text-muted text-[10px] hover:text-white transition-colors block">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
