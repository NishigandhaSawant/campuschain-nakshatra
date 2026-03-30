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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-zinc-500 animate-pulse font-medium">Loading Admin Dashboard...</div>
      </div>
    );
  }

  const validPendingCount = pendingStudents.filter((p) => p.domainValid).length;

  return (
    <div className="min-h-screen flex text-white relative">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0 bg-black/20 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-black text-black">
            C
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">CampusChain</div>
            <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Campus Admin</div>
          </div>
        </Link>
        <button onClick={() => setActiveTab("new_accounts")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "new_accounts" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>📨</span> New Accounts
          {pendingStudents.length > 0 && (
            <span className="ml-auto bg-red-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md">
              {pendingStudents.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab("keys")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "keys" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>🔑</span> License Keys
        </button>
        <button onClick={() => setActiveTab("students")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "students" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>🎓</span> Students
        </button>
        <button onClick={() => setActiveTab("rewards")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "rewards" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>🎁</span> Rewards
        </button>

        <div className="mt-auto pt-6 border-t border-white/5 px-2">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">{uni.name}</div>
          <div className="text-sm font-bold text-white truncate">{admin.email}</div>
          <button onClick={handleLogout} className="text-xs text-red-400 mt-4 font-bold hover:underline">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tighter">{uni.name}</h1>
            <p className="text-zinc-500 text-sm mt-1 font-medium">Campus Admin Control Center — {uni.domain}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Pending Signups", value: pendingStudents.length },
              { label: "Total Keys", value: keys.length },
              { label: "Active Students", value: students.filter((s) => s.activated).length },
              { label: "Unused Keys", value: keys.filter((k) => k.status === "unused").length },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">{s.label}</div>
                <div className="text-4xl font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Section: New Accounts */}
          {activeTab === "new_accounts" && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Student Registrations</h2>
                  <p className="text-zinc-500 text-sm">Verify students matching the <span className="text-white font-bold">{uni.domain}</span> domain.</p>
                </div>
                {selectedPending.size > 0 && (
                  <button onClick={handleBulkApprove} className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest border border-white hover:bg-zinc-200 transition-all">
                    Approve Selected ({selectedPending.size})
                  </button>
                )}
              </div>

              {csvData && (
                <div className="p-6 rounded-2xl bg-green-400/5 border border-green-400/20 mb-8 flex items-center justify-between">
                  <div>
                    <div className="text-green-400 text-sm font-bold flex items-center gap-2">
                       <span>✓</span> Batch Approval Successful
                    </div>
                    <p className="text-zinc-500 text-xs mt-1">Export license keys to distribute to students.</p>
                  </div>
                  <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-green-400 text-black text-xs font-black uppercase tracking-widest hover:brightness-110">Download CSV</button>
                </div>
              )}

              {pendingStudents.length === 0 ? (
                <div className="py-20 text-center text-zinc-500 font-medium">No new student registrations found.</div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedPending.size === validPendingCount && validPendingCount > 0} 
                            onChange={toggleSelectAll}
                            className="accent-white"
                          />
                        </th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Name</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Department</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingStudents.map((ps) => (
                        <tr key={ps.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 text-center">
                            {ps.domainValid && (
                              <input 
                                type="checkbox" 
                                checked={selectedPending.has(ps.id)} 
                                onChange={() => toggleSelect(ps.id)}
                                className="accent-white"
                              />
                            )}
                          </td>
                          <td className="p-4 font-bold text-white text-sm">{ps.name}</td>
                          <td className="p-4 text-zinc-400 text-sm">
                            {ps.email}
                            {!ps.domainValid && <span className="ml-2 text-[10px] text-red-400 font-bold uppercase tracking-tighter">Domain Mismatch</span>}
                          </td>
                          <td className="p-4 text-zinc-500 text-sm">{ps.department}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleRejectPending(ps.id)} className="text-[10px] font-black text-red-500 uppercase hover:underline">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Section: License Keys */}
          {activeTab === "keys" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Generated License Keys</h2>
              <div className="glass-card overflow-hidden">
                {keys.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-medium">No keys generated yet.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Key String</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Student</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <code className="text-zinc-300 font-mono text-sm bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">{k.key}</code>
                              <button onClick={() => copyKey(k.key)} className="text-zinc-600 hover:text-white text-xs">{copiedKey === k.key ? "✓" : "📋"}</button>
                            </div>
                          </td>
                          <td className="p-4 text-white text-sm font-medium">{k.assignedToName || "—"}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${k.status === "redeemed" ? "bg-zinc-800 text-zinc-500" : "bg-white/10 text-white"}`}>{k.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            {k.status === "unused" && <button onClick={() => handleRevoke(k.id)} className="text-[10px] font-black text-red-500 uppercase hover:underline">Revoke</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Section: Students */}
          {activeTab === "students" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Registered Students</h2>
              <div className="glass-card overflow-hidden">
                {students.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-medium">No students registered yet.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Student</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Department</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Balance</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{s.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-tighter">{s.email}</div>
                          </td>
                          <td className="p-4 text-zinc-500 text-sm">{s.department}</td>
                          <td className="p-4">
                            <div className="text-white font-black text-sm">{s.campusBalance} <span className="text-[10px] text-zinc-600">CAMP</span></div>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleToggleStudent(s.id)} className={`text-[10px] font-black uppercase hover:underline ${s.status === "active" ? "text-red-500" : "text-green-500"}`}>
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

          {/* Section: Rewards */}
          {activeTab === "rewards" && (() => {
            const activatedStudents = students.filter((s) => s.status === "active" && s.activated);
            const filteredStudents = rewardDeptFilter === "all" ? activatedStudents : activatedStudents.filter((s) => s.department === rewardDeptFilter);

            return (
              <div className="animate-fade-in">
                <div className="glass-card p-8 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <h2 className="text-xl font-bold text-white mb-2">Learn-to-Earn Rewards</h2>
                    <p className="text-zinc-500 text-sm">Issue $CAMPUS to students for participation, GPA milestones, or events.</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">AMOUNT</label>
                    <input type="number" className="input-field" value={rewardAmount} onChange={(e) => setRewardAmount(Number(e.target.value))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">REASON / MEMO</label>
                    <input className="input-field" placeholder="e.g. Workshop Attendance" value={rewardReason} onChange={(e) => setRewardReason(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">DEPT FILTER</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-xs" value={rewardDeptFilter} onChange={(e) => { setRewardDeptFilter(e.target.value as Department | "all"); setSelectedRewardStudents(new Set()); }}>
                      <option value="all">All Departments</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button onClick={handleBatchReward} className="w-full py-3.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest border border-white hover:bg-zinc-200">Issue {rewardAmount} $CAMP to {selectedRewardStudents.size} Students</button>
                  </div>
                </div>

                <div className="glass-card overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 w-12 text-center">
                          <input type="checkbox" checked={selectedRewardStudents.size === filteredStudents.length && filteredStudents.length > 0} onChange={() => { if (selectedRewardStudents.size === filteredStudents.length) setSelectedRewardStudents(new Set()); else setSelectedRewardStudents(new Set(filteredStudents.map(s => s.id))); }} className="accent-white" />
                        </th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Student</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={selectedRewardStudents.has(s.id)} onChange={() => { const next = new Set(selectedRewardStudents); if (next.has(s.id)) next.delete(s.id); else next.add(s.id); setSelectedRewardStudents(next); }} className="accent-white" />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{s.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{s.department}</div>
                          </td>
                          <td className="p-4 text-right text-white font-black">{s.campusBalance} CAMP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
