"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSession,
  getCampusAdminByEmail,
  getUniversities,
  getLicenseKeys,
  revokeLicenseKey,
  getStudents,
  toggleStudentStatus,
  rewardSelectedStudents,
  getPendingStudents,
  approvePendingStudents,
  rejectPendingStudent,
  logout,
  DEPARTMENTS,
  University,
  LicenseKey,
  Student,
  CampusAdmin,
  PendingStudent,
  Department,
} from "@/lib/store";

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<CampusAdmin | null>(null);
  const [uni, setUni] = useState<University | null>(null);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [rewardAmount, setRewardAmount] = useState(50);
  const [rewardReason, setRewardReason] = useState("");
  const [activeTab, setActiveTab] = useState<"new_accounts" | "keys" | "students" | "rewards">("new_accounts");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(new Set());
  const [csvData, setCsvData] = useState<{ name: string; email: string; department: string; licenseKey: string }[] | null>(null);
  const [selectedRewardStudents, setSelectedRewardStudents] = useState<Set<string>>(new Set());
  const [rewardDeptFilter, setRewardDeptFilter] = useState<Department | "all">("all");

  const refresh = useCallback(() => {
    if (!admin) return;
    setKeys(getLicenseKeys(admin.universityId));
    setStudents(getStudents(admin.universityId));
    const uniData = getUniversities().find((u) => u.id === admin.universityId);
    if (uniData) setUni(uniData);

    // Get pending students whose email domain matches this university
    const allPending = getPendingStudents();
    if (uniData) {
      const domainPending = allPending.filter((p) => {
        const emailDomain = "@" + p.email.split("@")[1];
        return emailDomain.toLowerCase() === uniData.domain.toLowerCase() && p.status === "pending";
      });
      setPendingStudents(domainPending);
    }
  }, [admin]);

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
  }, [router]);

  useEffect(() => {
    if (admin) refresh();
  }, [admin, refresh]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
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
    if (!rewardReason.trim()) {
      showToast("Please enter a reason for the reward.", "error");
      return;
    }
    if (selectedRewardStudents.size === 0) {
      showToast("Please select at least one student.", "error");
      return;
    }
    const count = rewardSelectedStudents(Array.from(selectedRewardStudents), rewardAmount, rewardReason);
    refresh();
    setSelectedRewardStudents(new Set());
    showToast(`🎁 Dropped ${rewardAmount} $CAMPUS to ${count} students!`);
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

  // ---- Pending student selection ----

  function toggleSelect(id: string) {
    setSelectedPending((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const validPending = pendingStudents.filter((p) => p.domainValid);
    if (selectedPending.size === validPending.length) {
      setSelectedPending(new Set());
    } else {
      setSelectedPending(new Set(validPending.map((p) => p.id)));
    }
  }

  function handleBulkApprove() {
    if (!admin || !uni || selectedPending.size === 0) return;
    const results = approvePendingStudents(Array.from(selectedPending), admin.universityId, uni.name);
    setCsvData(results);
    setSelectedPending(new Set());
    refresh();
    showToast(`✅ Approved ${results.length} students! License keys generated.`);
  }

  function handleRejectPending(id: string) {
    rejectPendingStudent(id);
    refresh();
    showToast("Student registration rejected.");
  }

  function exportCSV() {
    if (!csvData || csvData.length === 0) return;
    const header = "Name,Email,Department,License Key";
    const rows = csvData.map((r) => `"${r.name}","${r.email}","${r.department}","${r.licenseKey}"`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campuschain_license_keys_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!admin || !uni) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-pulse">Loading...</div>
      </div>
    );
  }

  const validPendingCount = pendingStudents.filter((p) => p.domainValid).length;
  const invalidPendingCount = pendingStudents.filter((p) => !p.domainValid).length;

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
        <button onClick={() => setActiveTab("new_accounts")} className={`sidebar-link ${activeTab === "new_accounts" ? "active" : ""}`}>
          <span>📨</span> New Accounts
          {pendingStudents.length > 0 && (
            <span className="ml-auto bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingStudents.length}
            </span>
          )}
        </button>
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
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">{uni.name}</h1>
            <p className="text-muted mt-1">
              Campus Admin Dashboard — {uni.domain}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="glass-card stat-card">
              <span className="stat-label">Pending Signups</span>
              <span className="stat-value">{pendingStudents.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Total Keys</span>
              <span className="stat-value">{keys.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Unused Keys</span>
              <span className="stat-value">{keys.filter((k) => k.status === "unused").length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{students.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Activated</span>
              <span className="stat-value">{students.filter((s) => s.activated).length}</span>
            </div>
          </div>

          {/* ============== TAB: NEW ACCOUNTS ============== */}
          {activeTab === "new_accounts" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">New Student Registrations</h2>
                <p className="text-muted text-sm mt-1">
                  Students who registered with a <code className="text-secondary-light">{uni.domain}</code> email.
                  Verify and approve them to generate license keys.
                </p>
              </div>

              {/* CSV Export Modal */}
              {csvData && csvData.length > 0 && (
                <div className="glass-card p-6 mb-6 border-l-4 border-success/50 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        ✅ {csvData.length} Students Approved
                      </h3>
                      <p className="text-muted text-sm mt-1">
                        License keys generated. Export the list to share with students securely.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={exportCSV} className="btn-primary flex items-center gap-2">
                        📥 Export CSV
                      </button>
                      <button onClick={() => setCsvData(null)} className="btn-secondary text-sm">
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>License Key</th>
                          <th>Copy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.map((r, i) => (
                          <tr key={i}>
                            <td className="font-medium text-white">{r.name}</td>
                            <td className="text-sm">{r.email}</td>
                            <td className="text-sm text-muted">{r.department}</td>
                            <td>
                              <code className="text-sm font-mono text-secondary-light bg-secondary/5 px-2 py-1 rounded-md">
                                {r.licenseKey}
                              </code>
                            </td>
                            <td>
                              <button
                                onClick={() => copyKey(r.licenseKey)}
                                className="text-muted hover:text-white text-xs transition-colors"
                              >
                                {copiedKey === r.licenseKey ? "✅" : "📋"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pending Students List */}
              {pendingStudents.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="text-3xl mb-3">📭</div>
                  <p className="text-muted">No new student registrations.</p>
                  <p className="text-muted text-sm mt-1">
                    Students can register at <code className="text-secondary-light">/register</code> using their <code className="text-secondary-light">{uni.domain}</code> email.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted">
                        <span className="text-success font-semibold">{validPendingCount}</span> valid domain
                        {invalidPendingCount > 0 && (
                          <> · <span className="text-danger font-semibold">{invalidPendingCount}</span> invalid</>
                        )}
                      </span>
                      <button
                        onClick={toggleSelectAll}
                        className="text-xs text-primary-light hover:text-white transition-colors"
                      >
                        {selectedPending.size === validPendingCount ? "Deselect All" : "Select All Valid"}
                      </button>
                    </div>
                    {selectedPending.size > 0 && (
                      <button onClick={handleBulkApprove} className="btn-success flex items-center gap-2">
                        ✅ Approve & Generate Keys ({selectedPending.size})
                      </button>
                    )}
                  </div>

                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedPending.size === validPendingCount && validPendingCount > 0}
                              onChange={toggleSelectAll}
                              className="accent-primary"
                            />
                          </th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Domain Check</th>
                          <th>Registered</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingStudents.map((ps) => (
                          <tr key={ps.id} className={!ps.domainValid ? "opacity-60" : ""}>
                            <td>
                              {ps.domainValid ? (
                                <input
                                  type="checkbox"
                                  checked={selectedPending.has(ps.id)}
                                  onChange={() => toggleSelect(ps.id)}
                                  className="accent-primary"
                                />
                              ) : (
                                <span className="text-danger text-xs">✕</span>
                              )}
                            </td>
                            <td className="font-medium text-white">{ps.name}</td>
                            <td>
                              <div className="text-sm">
                                {ps.email}
                                {!ps.domainValid && (
                                  <div className="text-[11px] text-danger mt-0.5">
                                    ⚠️ Domain does not match {uni.domain}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="text-sm text-muted">{ps.department}</span>
                            </td>
                            <td>
                              {ps.domainValid ? (
                                <span className="badge badge-active">✓ Valid</span>
                              ) : (
                                <span className="badge badge-suspended">✕ Invalid</span>
                              )}
                            </td>
                            <td className="text-sm text-muted">
                              {new Date(ps.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td>
                              <button
                                onClick={() => handleRejectPending(ps.id)}
                                className="btn-danger text-xs"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============== TAB: LICENSE KEYS ============== */}
          {activeTab === "keys" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">License Keys</h2>
                <p className="text-muted text-sm mt-1">
                  Keys generated via student approvals. Students use these to activate their wallet.
                </p>
              </div>

              <div className="glass-card overflow-hidden">
                {keys.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-3xl mb-3">🔐</div>
                    <p className="text-muted">No keys generated yet.</p>
                    <p className="text-muted text-sm mt-1">Approve new student registrations to generate keys automatically.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>License Key</th>
                        <th>Assigned To</th>
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
                          <td className="text-sm">{k.assignedToName || k.assignedTo || "—"}</td>
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

          {/* ============== TAB: STUDENTS ============== */}
          {activeTab === "students" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Registered Students</h2>
                <p className="text-muted text-sm mt-1">
                  All approved students. Students who have activated their key have full wallet access.
                </p>
              </div>
              <div className="glass-card overflow-hidden">
                {students.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-3xl mb-3">🎓</div>
                    <p className="text-muted">No students approved yet.</p>
                    <p className="text-muted text-sm mt-1">Go to &quot;New Accounts&quot; to approve registrations.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Balance</th>
                        <th>Activated</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id}>
                          <td className="font-medium text-white">{s.name}</td>
                          <td className="text-sm">{s.email}</td>
                          <td className="text-sm text-muted">{s.department}</td>
                          <td className="font-semibold">{s.campusBalance} $CAMP</td>
                          <td>
                            {s.activated ? (
                              <span className="badge badge-active">✓ Active</span>
                            ) : (
                              <span className="badge badge-unused">Pending Key</span>
                            )}
                          </td>
                          <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                          <td>
                            <button
                              onClick={() => handleToggleStudent(s.id)}
                              className={s.status === "active" ? "btn-danger" : "btn-success"}
                            >
                              {s.status === "active" ? "Suspend" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ============== TAB: REWARDS ============== */}
          {activeTab === "rewards" && (() => {
            const activatedStudents = students.filter((s) => s.status === "active" && s.activated);
            const filteredStudents = rewardDeptFilter === "all"
              ? activatedStudents
              : activatedStudents.filter((s) => s.department === rewardDeptFilter);

            const toggleRewardSelect = (id: string) => {
              setSelectedRewardStudents((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              });
            };
            const toggleRewardSelectAll = () => {
              if (selectedRewardStudents.size === filteredStudents.length) {
                setSelectedRewardStudents(new Set());
              } else {
                setSelectedRewardStudents(new Set(filteredStudents.map((s) => s.id)));
              }
            };

            return (
            <div className="animate-fade-in">
              {/* Config Card */}
              <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">Learn-to-Earn: Selective Reward</h2>
                <p className="text-muted text-sm mb-6">
                  Choose exactly which students receive $CAMPUS tokens. Filter by department or pick individually.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <label className="text-xs text-muted block mb-2">Reason *</label>
                    <input
                      className="input-field"
                      placeholder="e.g. 100% Attendance — March 2026"
                      value={rewardReason}
                      onChange={(e) => setRewardReason(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Filter by Department</label>
                    <select
                      className="select-field"
                      value={rewardDeptFilter}
                      onChange={(e) => {
                        setRewardDeptFilter(e.target.value as Department | "all");
                        setSelectedRewardStudents(new Set());
                      }}
                    >
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Student Selection */}
              {activatedStudents.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="text-3xl mb-3">🎓</div>
                  <p className="text-muted">No activated students yet.</p>
                  <p className="text-muted text-sm mt-1">Students need to redeem their license key before they can receive rewards.</p>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted">
                        <span className="text-white font-semibold">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? "s" : ""}
                        {rewardDeptFilter !== "all" && (
                          <> in <span className="text-secondary-light">{rewardDeptFilter}</span></>
                        )}
                      </span>
                      <button
                        onClick={toggleRewardSelectAll}
                        className="text-xs text-primary-light hover:text-white transition-colors"
                      >
                        {selectedRewardStudents.size === filteredStudents.length && filteredStudents.length > 0 ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    {selectedRewardStudents.size > 0 && (
                      <button onClick={handleBatchReward} className="btn-primary flex items-center gap-2">
                        🎁 Drop {rewardAmount} $CAMPUS to {selectedRewardStudents.size} Student{selectedRewardStudents.size !== 1 ? "s" : ""}
                      </button>
                    )}
                  </div>

                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedRewardStudents.size === filteredStudents.length && filteredStudents.length > 0}
                              onChange={toggleRewardSelectAll}
                              className="accent-primary"
                            />
                          </th>
                          <th>Student</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Current Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className={selectedRewardStudents.has(s.id) ? "bg-primary/5" : ""}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedRewardStudents.has(s.id)}
                                onChange={() => toggleRewardSelect(s.id)}
                                className="accent-primary"
                              />
                            </td>
                            <td className="font-medium text-white">{s.name}</td>
                            <td className="text-sm">{s.email}</td>
                            <td className="text-sm text-muted">{s.department}</td>
                            <td className="font-semibold">{s.campusBalance} $CAMP</td>
                            <td><span className="badge badge-active">Active</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  {selectedRewardStudents.size > 0 && (
                    <div className="glass-card p-4 mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted">
                        Total distribution:{" "}
                        <span className="text-white font-bold">
                          {(selectedRewardStudents.size * rewardAmount).toLocaleString()} $CAMPUS
                        </span>
                        {" "}to{" "}
                        <span className="text-white font-semibold">{selectedRewardStudents.size}</span> students
                        {rewardReason && (
                          <> — <span className="text-secondary-light">&quot;{rewardReason}&quot;</span></>
                        )}
                      </div>
                      <button onClick={handleBatchReward} className="btn-success text-sm">
                        ✅ Confirm & Execute
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            );
          })()}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
