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

      // Redirect based on role
      if (role === "super_admin") router.push("/super-admin");
      else if (role === "campus_admin") router.push("/admin");
      else router.push("/dashboard");
    }, 800);
  }

  const roles: { key: Role; label: string; icon: string; desc: string }[] = [
    { key: "student", label: "Student", icon: "🎓", desc: "Access your wallet & marketplace" },
    { key: "campus_admin", label: "Campus Admin", icon: "🔑", desc: "Manage keys & students" },
    { key: "super_admin", label: "Super Admin", icon: "🏛️", desc: "Platform governance" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CampusChain</span>
        </Link>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-muted text-sm text-center mb-8">
            Sign in to your CampusChain account
          </p>

          {/* Role Tabs */}
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
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all ${
                  role === r.key
                    ? "bg-primary/20 border border-primary/30 text-white"
                    : "bg-white/3 border border-white/5 text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span className="text-xs font-semibold">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-muted block mb-2">
                {role === "super_admin" ? "Admin Email" : role === "campus_admin" ? "Campus Admin Email" : "Student Email"}
              </label>
              <input
                className="input-field"
                type="email"
                placeholder={
                  role === "super_admin"
                    ? "admin@campuschain.io"
                    : role === "campus_admin"
                    ? "admin@apsit.edu.in"
                    : "student@apsit.edu.in"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-2">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Authenticating...
                </>
              ) : (
                <>Sign In →</>
              )}
            </button>
          </form>

          {/* Helper Text */}
          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center space-y-3">
            {role === "super_admin" && (
              <p className="text-xs text-muted">
                Only authorized platform administrators can access this panel.
              </p>
            )}
            {role === "campus_admin" && (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  Don&apos;t have an admin account yet?
                </p>
                <Link
                  href="/request-campus"
                  className="inline-block text-sm font-semibold text-primary-light hover:text-white transition-colors"
                >
                  Request Campus Registration →
                </Link>
              </div>
            )}
            {role === "student" && (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  New student? Create your account first.
                </p>
                <Link
                  href="/register"
                  className="inline-block text-sm font-semibold text-primary-light hover:text-white transition-colors"
                >
                  Student Registration →
                </Link>
                <p className="text-[11px] text-muted mt-1">
                  After registration, your Campus Admin will approve and share a License Key with you.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-muted text-sm hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
