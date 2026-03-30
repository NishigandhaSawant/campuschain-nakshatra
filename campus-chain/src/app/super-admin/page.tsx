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
    <div className="min-h-screen flex text-white relative">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 p-6 flex flex-col gap-2 shrink-0 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-10 px-2">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-black text-black">
              C
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">CampusChain</div>
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Platform</div>
            </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
            title="Logout"
          >
            <span className="text-xs font-bold">✕</span>
          </button>
        </div>

        <button onClick={() => setActiveTab("requests")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "requests" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>📨</span> Requests
          {pendingRequests.length > 0 && (
            <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "requests" ? "bg-black text-white" : "bg-red-400 text-black"}`}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab("universities")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "universities" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>🏛️</span> Universities
        </button>

        <div className="mt-auto pt-6 border-t border-white/5 px-2">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Authenticated as</div>
          <div className="text-sm font-bold text-white">Super Admin</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto animate-fade-in">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Pending Requests", value: pendingRequests.length },
              { label: "Total Partners", value: universities.length },
              { label: "Active Nodes", value: universities.filter((u) => u.status === "active").length },
              { label: "Total Ecosystem", value: universities.reduce((a, u) => a + u.studentCount, 0) },
            ].map((s, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">{s.label}</div>
                <div className="text-4xl font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Section: Requests */}
          {activeTab === "requests" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">University Onboarding Requests</h2>
              {pendingRequests.length === 0 ? (
                <div className="py-20 text-center text-zinc-500 font-medium">No pending registration requests.</div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white">{req.collegeName}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <code className="text-[11px] text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">{req.collegeDomain}</code>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none">Submitted {new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(req.id)} className="px-4 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200">Approve</button>
                          <button onClick={() => setRejectId(req.id)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10">Reject</button>
                        </div>
                      </div>

                      {rejectId === req.id && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-3 items-center animate-fade-in">
                          <input 
                            className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-zinc-700" 
                            placeholder="Type reason for rejection..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <button onClick={() => handleReject(req.id)} className="text-xs font-bold text-red-500 uppercase hover:underline">Confirm</button>
                          <button onClick={() => setRejectId(null)} className="text-xs font-bold text-zinc-500 uppercase hover:underline">Cancel</button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Admin Contact</div>
                          <div className="text-sm font-medium">{req.adminName}</div>
                          <div className="text-[11px] text-zinc-500 truncate">{req.adminEmail}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Website</div>
                          <a href={req.collegeWebsite} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white underline underline-offset-2 hover:opacity-80 truncate block">{req.collegeWebsite}</a>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Phone</div>
                          <div className="text-sm font-medium">{req.collegePhone}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">ID</div>
                          <div className="text-[11px] text-zinc-600 font-mono">#{req.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {processedRequests.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-sm font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Historical Activity</h3>
                  <div className="glass-card overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Institution</th>
                          <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                          <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRequests.map((req) => (
                          <tr key={req.id} className="border-b border-white/5 opacity-60">
                            <td className="p-4 text-sm font-bold">{req.collegeName}</td>
                            <td className="p-4 font-black uppercase text-[10px] tracking-widest">{req.status}</td>
                            <td className="p-4 text-right text-[10px] text-zinc-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Universities */}
          {activeTab === "universities" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Registered Ecosystem Partners</h2>
              <div className="glass-card overflow-hidden">
                {universities.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-medium">No universities registered yet.</div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">University</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Users</th>
                        <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.map((uni) => (
                        <tr key={uni.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{uni.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-tighter">{uni.domain}</div>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${uni.status === "active" ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}>{uni.status}</span>
                          </td>
                          <td className="p-4 text-sm font-bold text-zinc-400">{uni.studentCount}</td>
                          <td className="p-4 text-right">
                             <div className="flex gap-2 justify-end">
                                <button onClick={() => handleToggle(uni.id)} className="text-[10px] font-black uppercase hover:underline">{uni.status === "active" ? "Suspend" : "Activate"}</button>
                                <button onClick={() => handleRemove(uni.id)} className="text-[10px] font-black uppercase text-red-500 hover:underline ml-2">Delete</button>
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
