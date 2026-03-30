"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSession,
  getStudentByEmail,
  getPendingStudents,
  activateStudentWithKey,
  getTransactions,
  transferTokens,
  getListings,
  createListing,
  logout,
  Student,
  Transaction,
  MarketplaceListing,
} from "@/lib/store";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Student | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [activeTab, setActiveTab] = useState<"wallet" | "send" | "marketplace" | "qr">("wallet");
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState(10);
  const [sendDesc, setSendDesc] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // License key activation
  const [licenseKey, setLicenseKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activating, setActivating] = useState(false);

  // Marketplace form
  const [listTitle, setListTitle] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [listPrice, setListPrice] = useState(25);
  const [listCat, setListCat] = useState<MarketplaceListing["category"]>("textbook");

  const refresh = useCallback(() => {
    const session = getSession();
    if (!session || session.role !== "student") {
      router.push("/login");
      return;
    }

    const u = getStudentByEmail(session.email);
    if (u) {
      setUser(u);
      setIsPending(false);
      if (u.activated) {
        setTxns(getTransactions(u.walletAddress).reverse());
        setListings(getListings());
      }
      return;
    }

    const pending = getPendingStudents();
    const ps = pending.find((p) => p.email === session.email);
    if (ps && ps.status === "approved") {
      setIsPending(true);
      return;
    }

    router.push("/login");
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setKeyError("");
    if (!licenseKey.trim()) {
      setKeyError("Please enter your license key.");
      return;
    }
    if (!user) return;

    setActivating(true);
    setTimeout(() => {
      const result = activateStudentWithKey(user.email, licenseKey.trim().toUpperCase());
      if (!result.success) {
        setKeyError(result.error || "Activation failed.");
        setActivating(false);
        return;
      }
      setActivating(false);
      refresh();
      showToast("🎉 Account activated! Welcome to CampusChain!");
    }, 1000);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !sendTo.trim() || !sendAmount) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    const result = transferTokens(user.email, sendTo.trim(), sendAmount, sendDesc);
    if (!result.success) {
      showToast(result.error!, "error");
      return;
    }
    showToast(`Sent ${sendAmount} $CAMPUS successfully! (Gasless ⚡)`);
    setSendTo("");
    setSendAmount(10);
    setSendDesc("");
    refresh();
  }

  function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !listTitle.trim()) {
      showToast("Please enter a title.", "error");
      return;
    }
    createListing(user.id, user.name, listTitle, listDesc, listPrice, listCat);
    showToast("Listing created! Escrow will activate when a buyer pays.");
    setListTitle("");
    setListDesc("");
    setListPrice(25);
    refresh();
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user && !isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-zinc-500 animate-pulse font-medium">Loading Dashboard...</div>
      </div>
    );
  }

  if (user && !user.activated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="w-full max-w-lg z-10 animate-fade-in">
          <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl font-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              C
            </div>
            <span className="text-2xl font-bold text-white tracking-tighter">CampusChain</span>
          </Link>

          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-white">🔑</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Activate Your Account</h2>
              <p className="text-muted text-sm mt-2">
                Welcome, <strong className="text-white">{user.name}</strong>! Your registration has been
                approved. Enter your License Key to unlock your wallet.
              </p>
            </div>

            <div className="glass-card p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 font-medium">NAME</span>
                  <div className="text-white font-semibold mt-0.5">{user.name}</div>
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">EMAIL</span>
                  <div className="text-white font-semibold mt-0.5">{user.email}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleActivate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-muted block mb-2 font-medium uppercase tracking-wider">License Key *</label>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all text-center text-lg font-mono tracking-[0.2em]"
                  placeholder="XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  maxLength={19}
                />
              </div>

              {keyError && (
                <div className="text-red-400 text-xs bg-red-400/5 border border-red-400/10 rounded-xl p-3">
                  ⚠️ {keyError}
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="w-full py-3.5 rounded-xl bg-white text-black font-bold border border-white hover:bg-zinc-200 transition-all text-sm disabled:opacity-50"
              >
                {activating ? "Activating Wallet..." : "Unlock Wallet →"}
              </button>
            </form>
          </div>

          <div className="text-center mt-8">
            <button onClick={handleLogout} className="text-muted text-xs hover:text-white transition-colors">
              ← Sign Out
            </button>
          </div>
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  if (!user) return null;

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
            <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Student</div>
          </div>
        </Link>
        <button onClick={() => setActiveTab("wallet")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "wallet" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>📊</span> Transactions
        </button>
        <button onClick={() => setActiveTab("send")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "send" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>💸</span> Send Tokens
        </button>
        <button onClick={() => setActiveTab("marketplace")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "marketplace" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>🛒</span> Marketplace
        </button>
        <button onClick={() => setActiveTab("qr")} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "qr" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}>
          <span>📱</span> Tap-to-Pay
        </button>

        <div className="mt-auto pt-6 border-t border-white/5 px-2">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">{user.universityName}</div>
          <div className="text-sm font-bold text-white truncate">{user.name}</div>
          <div className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 mt-4 font-bold hover:underline"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">
                Hello, {user.name.split(" ")[0]}
              </h1>
              <p className="text-zinc-500 text-sm mt-1 font-medium">Your CampusChain Wallet</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-400 font-bold uppercase tracking-widest">{user.status}</span>
              <code className="text-zinc-500 font-mono bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                {user.walletAddress.slice(0, 8)}…{user.walletAddress.slice(-6)}
              </code>
            </div>
          </div>

          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl p-10 mb-8 bg-white/[0.03] border border-white/10">
            <div className="relative z-10">
              <div className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-3">$CAMPUS BALANCE</div>
              <div className="text-6xl font-black text-white tracking-tighter">
                {user.campusBalance.toLocaleString()}
                <span className="text-xl text-zinc-600 ml-3">CAMP</span>
              </div>
              <div className="flex gap-8 mt-8 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <div>SBT ID: <span className="text-white">{user.sbtTokenId}</span></div>
                <div>GAS: <span className="text-white text-green-400">⚡ SPONSORED</span></div>
                <div>CRYPTO: <span className="text-white">ON-CHAIN</span></div>
              </div>
            </div>
          </div>

          {/* Active Section */}
          <div className="glass-card min-h-[400px] flex flex-col">
            {activeTab === "wallet" && (
              <div className="p-6">
                <h2 className="text-lg font-bold text-white mb-6">Recent Activity</h2>
                {txns.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500 font-medium">No transactions yet.</div>
                ) : (
                  <div className="space-y-4">
                    {txns.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg">{tx.type === "reward" ? "🎁" : "💸"}</div>
                          <div>
                            <div className="text-sm font-bold text-white">{tx.description}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{new Date(tx.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className={`text-sm font-black ${tx.to === user.walletAddress ? "text-green-400" : "text-red-400"}`}>
                          {tx.to === user.walletAddress ? "+" : "-"}{tx.amount} CAMP
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "send" && (
              <div className="p-6 max-w-2xl">
                <h2 className="text-xl font-bold text-white mb-2">Send $CAMPUS</h2>
                <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Secure, gasless peer-to-peer transfers. Authenticated by your device passkey.</p>
                <form onSubmit={handleSend} className="space-y-6">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">RECIPIENT EMAIL</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all"
                      type="email"
                      placeholder="friend@apsit.edu.in"
                      value={sendTo}
                      onChange={(e) => setSendTo(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">AMOUNT</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-2">MEMO</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-white/20 transition-all"
                        placeholder="Coffee, books, etc."
                        value={sendDesc}
                        onChange={(e) => setSendDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs border border-white hover:bg-zinc-200 transition-all mt-4">
                    Authorize Transaction →
                  </button>
                </form>
              </div>
            )}

            {activeTab === "marketplace" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold text-white">Campus Marketplace</h2>
                  <button onClick={() => showToast("Marketplace listing feature coming soon!", "success")} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10">List Item</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <div key={item.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.category}</span>
                        <span className="text-[10px] font-bold text-zinc-400">{item.status}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <div className="text-lg font-black text-white">{item.price} <span className="text-[10px] text-zinc-600">CAMP</span></div>
                        <button className="px-3 py-1.5 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-tighter hover:bg-zinc-200">Buy</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "qr" && (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-bold text-white mb-2">Tap-to-Pay</h2>
                <p className="text-zinc-500 text-sm mb-10">Show this QR code at campus vendors for instantaneous gasless payments.</p>
                <div className="p-8 bg-white rounded-3xl mb-8">
                  <div className="w-48 h-48 bg-black flex items-center justify-center rounded-2xl">
                    <span className="text-6xl">🔳</span>
                  </div>
                </div>
                <code className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-400 font-mono">
                  {user.walletAddress}
                </code>
              </div>
            )}
          </div>
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
