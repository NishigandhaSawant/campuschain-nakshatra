"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUniversities,
  toggleUniversityStatus,
  removeUniversity,
  getUniversityRequests,
  approveUniversityRequest,
  rejectUniversityRequest,
  getSession,
  logout,
  University,
  UniversityRequest,
} from "@/lib/store";

export default function SuperAdminPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [requests, setRequests] = useState<UniversityRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "universities">("requests");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "super_admin") {
      router.push("/login");
      return;
    }
    refresh();
  }, [router]);

  function refresh() {
    setUniversities(getUniversities());
    setRequests(getUniversityRequests());
  }

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleApprove(id: string) {
    approveUniversityRequest(id);
    refresh();
    showToast("✅ University approved! Campus Admin account created.");
  }

  function handleReject(id: string) {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason.", "error");
      return;
    }
    rejectUniversityRequest(id, rejectReason);
    setRejectId(null);
    setRejectReason("");
    refresh();
    showToast("Request rejected.");
  }

  function handleToggle(id: string) {
    toggleUniversityStatus(id);
    refresh();
  }

  function handleRemove(id: string) {
    removeUniversity(id);
    refresh();
    showToast("University removed.");
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

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
            <div className="text-[11px] text-muted">Super Admin</div>
          </div>
        </Link>
        <button onClick={() => setActiveTab("requests")} className={`sidebar-link ${activeTab === "requests" ? "active" : ""}`}>
          <span>📨</span> Requests
          {pendingRequests.length > 0 && (
            <span className="ml-auto bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab("universities")} className={`sidebar-link ${activeTab === "universities" ? "active" : ""}`}>
          <span>🏛️</span> Universities
        </button>
        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <div className="text-xs text-muted">Logged in as</div>
          <div className="text-sm font-semibold text-white">Platform Owner</div>
          <button onClick={handleLogout} className="text-xs text-danger mt-2 hover:underline">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card stat-card">
              <span className="stat-label">Pending Requests</span>
              <span className="stat-value">{pendingRequests.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Total Universities</span>
              <span className="stat-value">{universities.length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Active</span>
              <span className="stat-value">{universities.filter((u) => u.status === "active").length}</span>
            </div>
            <div className="glass-card stat-card">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{universities.reduce((a, u) => a + u.studentCount, 0)}</span>
            </div>
          </div>

          {/* Tab: Requests */}
          {activeTab === "requests" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight">Campus Requests</h1>
                <p className="text-muted mt-1">
                  Review and verify university registration applications.
                </p>
              </div>

              {/* Pending Requests */}
              {pendingRequests.length === 0 ? (
                <div className="glass-card p-12 text-center mb-8">
                  <div className="text-3xl mb-3">📭</div>
                  <p className="text-muted">No pending requests.</p>
                  <p className="text-muted text-sm mt-1">New campus registrations will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="glass-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white">{req.collegeName}</h3>
                            <span className="badge badge-unused">Pending Review</span>
                          </div>
                          <p className="text-muted text-sm">
                            Submitted on {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted mb-1">Email Domain</div>
                          <code className="text-secondary-light text-sm bg-secondary/10 px-2 py-0.5 rounded-md">{req.collegeDomain}</code>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Website</div>
                          <a href={req.collegeWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-light hover:underline">{req.collegeWebsite}</a>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Phone</div>
                          <span className="text-sm text-white">{req.collegePhone}</span>
                        </div>
                        <div>
                          <div className="text-xs text-muted mb-1">Admin Contact</div>
                          <span className="text-sm text-white">{req.adminName}</span>
                          <br />
                          <span className="text-xs text-muted">{req.adminEmail}</span>
                        </div>
                      </div>

                      {rejectId === req.id ? (
                        <div className="flex gap-3 items-end mt-4 pt-4 border-t border-white/[0.06]">
                          <div className="flex-1">
                            <label className="text-xs text-muted block mb-2">Rejection Reason</label>
                            <input
                              className="input-field"
                              placeholder="e.g. Could not verify the institution"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                          </div>
                          <button onClick={() => handleReject(req.id)} className="btn-danger">
                            Confirm Reject
                          </button>
                          <button onClick={() => { setRejectId(null); setRejectReason(""); }} className="btn-secondary text-sm">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                          <button onClick={() => handleApprove(req.id)} className="btn-success flex items-center gap-2">
                            ✅ Approve & Create Admin
                          </button>
                          <button onClick={() => setRejectId(req.id)} className="btn-danger flex items-center gap-2">
                            ❌ Reject
                          </button>
                          <a href={req.collegeWebsite} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm ml-auto">
                            🔗 Verify Website
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-white mb-4">Past Requests</h2>
                  <div className="glass-card overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>College</th>
                          <th>Domain</th>
                          <th>Admin</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRequests.map((req) => (
                          <tr key={req.id}>
                            <td className="font-medium text-white">{req.collegeName}</td>
                            <td><code className="text-secondary text-sm">{req.collegeDomain}</code></td>
                            <td className="text-sm">{req.adminEmail}</td>
                            <td>
                              <span className={`badge ${req.status === "approved" ? "badge-active" : "badge-suspended"}`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="text-sm text-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Universities */}
          {activeTab === "universities" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight">Active Universities</h1>
                <p className="text-muted mt-1">
                  All approved campuses on the CampusChain network.
                </p>
              </div>

              <div className="glass-card overflow-hidden">
                {universities.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-3xl mb-3">🏫</div>
                    <p className="text-muted">No universities yet. Approve a request to get started.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>University</th>
                        <th>Domain</th>
                        <th>Website</th>
                        <th>Phone</th>
                        <th>Students</th>
                        <th>Admin</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.map((uni) => (
                        <tr key={uni.id}>
                          <td className="font-medium text-white">{uni.name}</td>
                          <td>
                            <code className="text-secondary text-sm bg-secondary/10 px-2 py-0.5 rounded-md">{uni.domain}</code>
                          </td>
                          <td>
                            {uni.website ? (
                              <a href={uni.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-light hover:underline">
                                Visit →
                              </a>
                            ) : "—"}
                          </td>
                          <td className="text-sm">{uni.phone || "—"}</td>
                          <td>{uni.studentCount}</td>
                          <td className="text-sm text-muted">{uni.adminEmail || "—"}</td>
                          <td>
                            <span className={`badge badge-${uni.status}`}>{uni.status}</span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggle(uni.id)}
                                className={uni.status === "active" ? "btn-danger" : "btn-success"}
                              >
                                {uni.status === "active" ? "Suspend" : "Activate"}
                              </button>
                              <button onClick={() => handleRemove(uni.id)} className="btn-danger">
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
