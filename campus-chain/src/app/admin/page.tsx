"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSession,
  getCampusAdminByEmail,
  getUniversities,
  getLicenseKeys,
  generateLicenseKeys,
  revokeLicenseKey,
  getStudents,
  toggleStudentStatus,
  batchRewardStudents,
  logout,
  University,
  LicenseKey,
  Student,
  CampusAdmin,
} from "@/lib/store";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<CampusAdmin | null>(null);
  const [uni, setUni] = useState<University | null>(null);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [keyCount, setKeyCount] = useState(5);
  const [rewardAmount, setRewardAmount] = useState(50);
  const [rewardReason, setRewardReason] = useState("");
  const [activeTab, setActiveTab] = useState<"keys" | "students" | "rewards">("keys");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "campus_admin") {
      router.push("/login");
      return;
    }
    const adminData = getCampusAdminByEmail(session.email);
    if (!adminData) {
      router.push("/login");
      return;
    }
    setAdmin(adminData);
    const uniData = getUniversities().find((u) => u.id === adminData.universityId);
    if (uniData) setUni(uniData);
    setKeys(getLicenseKeys(adminData.universityId));
    setStudents(getStudents(adminData.universityId));
  }, [router]);

  function refresh() {
    if (!admin) return;
    setKeys(getLicenseKeys(admin.universityId));
    setStudents(getStudents(admin.universityId));
    const uniData = getUniversities().find((u) => u.id === admin.universityId);
    if (uniData) setUni(uniData);
  }

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleGenerate() {
    if (!admin || !uni) return;
    generateLicenseKeys(admin.universityId, uni.name, keyCount);
    refresh();
    showToast(`Generated ${keyCount} new license keys!`);
  }

  function handleRevoke(keyId: string) {
    revokeLicenseKey(keyId);
    refresh();
    showToast("License key revoked.");
  }

  function handleToggleStudent(studentId: string) {
    toggleStudentStatus(studentId);
    refresh();
  }

  function handleBatchReward() {
    if (!admin || !rewardReason.trim()) {
      showToast("Please enter a reason for the reward.", "error");
      return;
    }
    const count = batchRewardStudents(admin.universityId, rewardAmount, rewardReason);
    refresh();
    showToast(`Dropped ${rewardAmount} $CAMPUS to ${count} students!`);
    setRewardReason("");
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!admin || !uni) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/[0.06] p-6 flex flex-col gap-2 shrink-0">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold">
            C
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">CampusChain</div>
            <div className="text-[11px] text-muted">Campus Admin</div>
          </div>
        </Link>
        <button onClick={() => setActiveTab("keys")} className={`sidebar-link ${activeTab === "keys" ? "active" : ""}`}>
          <span>🔑</span> License Keys
        </button>
        <button onClick={() => setActiveTab("students")} className={`sidebar-link ${activeTab === "students" ? "active" : ""}`}>
          <span>🎓</span> Students
        </button>
        <button onClick={() => setActiveTab("rewards")} className={`sidebar-link ${activeTab === "rewards" ? "active" : ""}`}>
          <span>🎁</span> Rewards
        </button>
        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <div className="text-xs text-muted">Managing</div>
          <div className="text-sm font-semibold text-white">{uni.name}</div>
          <div className="text-xs text-muted mt-0.5">{admin.email}</div>
          <button onClick={handleLogout} className="text-xs text-danger mt-2 hover:underline">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">{uni.name}</h1>
            <p className="text-muted mt-1">
              Campus Admin Dashboard — {uni.domain}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card stat-card">
              <span className="stat-label">Total Keys</span>
              <span className="stat-value">{keys.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Unused Keys</span>
              <span className="stat-value">{keys.filter((k) => k.status === "unused").length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Registered Students</span>
              <span className="stat-value">{students.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Active Students</span>
              <span className="stat-value">{students.filter((s) => s.status === "active").length}</span>
            </div>
          </div>

          {/* Tab: License Keys */}
          {activeTab === "keys" && (
            <div className="animate-fade-in">
              <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Generate License Keys</h2>
                <p className="text-muted text-sm mb-4">
                  Generate unique keys and distribute them to verified students to enable registration.
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 max-w-xs">
                    <label className="text-xs text-muted block mb-2">Number of Keys</label>
                    <input
                      type="number"
                      className="input-field"
                      min={1}
                      max={50}
                      value={keyCount}
                      onChange={(e) => setKeyCount(Number(e.target.value))}
                    />
                  </div>
                  <button onClick={handleGenerate} className="btn-primary">
                    🔑 Generate {keyCount} Keys
                  </button>
                </div>
              </div>

              <div className="glass-card overflow-hidden">
                {keys.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-3xl mb-3">🔐</div>
                    <p className="text-muted">No keys generated yet.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>License Key</th>
                        <th>Status</th>
                        <th>Redeemed By</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono text-secondary-light bg-secondary/5 px-2 py-1 rounded-md">
                                {k.key}
                              </code>
                              <button
                                onClick={() => copyKey(k.key)}
                                className="text-muted hover:text-white text-xs transition-colors"
                              >
                                {copiedKey === k.key ? "✅" : "📋"}
                              </button>
                            </div>
                          </td>
                          <td><span className={`badge badge-${k.status}`}>{k.status}</span></td>
                          <td className="text-sm">{k.redeemedBy || "—"}</td>
                          <td className="text-sm text-muted">{new Date(k.createdAt).toLocaleDateString()}</td>
                          <td>
                            {k.status === "unused" && (
                              <button onClick={() => handleRevoke(k.id)} className="btn-danger">Revoke</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Tab: Students */}
          {activeTab === "students" && (
            <div className="animate-fade-in glass-card overflow-hidden">
              {students.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-3xl mb-3">🎓</div>
                  <p className="text-muted">No students registered yet.</p>
                  <p className="text-muted text-sm mt-1">Generate keys and share them with students.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Wallet</th>
                      <th>SBT ID</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="font-medium text-white">{s.name}</td>
                        <td className="text-sm">{s.email}</td>
                        <td><code className="text-xs text-muted">{s.walletAddress.slice(0, 6)}…{s.walletAddress.slice(-4)}</code></td>
                        <td><code className="text-xs text-primary-light">{s.sbtTokenId}</code></td>
                        <td className="font-semibold">{s.campusBalance} $CAMP</td>
                        <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                        <td>
                          <button
                            onClick={() => handleToggleStudent(s.id)}
                            className={s.status === "active" ? "btn-danger" : "btn-success"}
                          >
                            {s.status === "active" ? "Suspend SBT" : "Activate SBT"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Rewards */}
          {activeTab === "rewards" && (
            <div className="animate-fade-in glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Learn-to-Earn: Batch Reward</h2>
              <p className="text-muted text-sm mb-6">
                Use smart contract automation to drop $CAMPUS tokens to all active students at {uni.name}.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-muted block mb-2">Amount per Student</label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Reason</label>
                  <input
                    className="input-field"
                    placeholder="e.g. 100% Attendance — March 2026"
                    value={rewardReason}
                    onChange={(e) => setRewardReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
                <div className="text-sm text-muted">
                  Distributing to{" "}
                  <span className="text-white font-semibold">
                    {students.filter((s) => s.status === "active").length}
                  </span>{" "}
                  active students
                </div>
                <button onClick={handleBatchReward} className="btn-primary">
                  🎁 Drop {rewardAmount} $CAMPUS Each
                </button>
              </div>
            </div>
          )}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
