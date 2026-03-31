"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loginSuperAdmin,
  loginCampusAdmin,
  loginStudent,
} from "@/lib/store";

type Role = "super_admin" | "campus_admin" | "student";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      let result: { success: boolean; error?: string };

      if (role === "super_admin") {
        result = loginSuperAdmin(email, password);
      } else if (role === "campus_admin") {
        result = loginCampusAdmin(email, password);
      } else {
        result = loginStudent(email, password);
      }

      if (!result.success) {
        setError(result.error || "Login failed.");
        setLoading(false);
        return;
      }

      if (role === "super_admin") router.push("/super-admin");
      else if (role === "campus_admin") router.push("/admin");
      else router.push("/dashboard");
    }, 800);
  }

  const roles: { key: Role; label: string; icon: string }[] = [
    { key: "student", label: "Student", icon: "🎓" },
    { key: "campus_admin", label: "Campus Admin", icon: "🔑" },
    { key: "super_admin", label: "Super Admin", icon: "🏛️" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <Link href="/" className="absolute top-6 left-6 px-4 py-2 bg-black text-white hover:bg-white hover:text-black transition-colors duration-200 rounded flex items-center gap-2 border border-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>
      <div className="w-full max-w-md z-10 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:scale-105">
            C
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter">CampusChain</span>
        </Link>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-muted text-sm text-center mb-8">
            Sign in to your CampusChain account
          </p>

          <div className="grid grid-cols-3 gap-2 mb-8">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  setRole(r.key);
                  setEmail("");
                  setPassword("");
                  setError("");
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg text-center transition-all ${
                  role === r.key
                    ? "bg-white border border-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-[1.02]"
                    : "bg-white/[0.03] border border-white/5 text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted block mb-2 font-medium">
                {role === "super_admin" ? "Admin Email" : role === "campus_admin" ? "Campus Admin Email" : "Student Email"}
              </label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-2 font-medium">Password</label>
              <input
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-sm"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
              {loading ? "Authenticating..." : "Sign In →"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center space-y-4">
            {role === "student" && (
              <div className="space-y-2">
                <p className="text-xs text-muted">New student?</p>
                <Link
                  href="/register"
                  className="inline-block text-sm font-semibold text-white underline underline-offset-4 hover:opacity-80 transition-all"
                >
                  Create Account →
                </Link>
              </div>
            )}
            {role === "campus_admin" && (
              <div className="space-y-2">
                <p className="text-xs text-muted">Register your institution?</p>
                <Link
                  href="/request-campus"
                  className="inline-block text-sm font-semibold text-white underline underline-offset-4 hover:opacity-80 transition-all"
                >
                  Apply Here →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
