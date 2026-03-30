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

    // Check if they're a fully approved student
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

    // Check if they're still pending
    const pending = getPendingStudents();
    const ps = pending.find((p) => p.email === session.email);
    if (ps && ps.status === "approved") {
      // Approved but not yet a full student — shouldn't happen normally
      setIsPending(true);
      return;
    }

    // Not found at all
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

  // Loading state
  if (!user && !isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted animate-pulse">Loading...</div>
      </div>
    );
  }

  // ================================================================
  // LICENSE KEY ACTIVATION GATE — student exists but hasn't entered key yet
  // ================================================================
  if (user && !user.activated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-full max-w-lg z-10 animate-fade-in">
          <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
              C
            </div>
            <span className="text-xl font-bold text-white tracking-tight">CampusChain</span>
          </Link>

          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔑</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Activate Your Account</h2>
              <p className="text-muted text-sm mt-2">
                Welcome, <strong className="text-white">{user.name}</strong>! Your registration has been
                approved. Enter the License Key provided by your Campus Admin to unlock your wallet.
              </p>
            </div>

            {/* Student Info */}
            <div className="glass-card p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted text-xs">Name</span>
                  <div className="text-white mt-0.5">{user.name}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Email</span>
                  <div className="text-white mt-0.5">{user.email}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Department</span>
                  <div className="text-secondary-light mt-0.5">{user.department}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">University</span>
                  <div className="text-white mt-0.5">{user.universityName}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleActivate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-muted block mb-2">License Key *</label>
                <input
                  className="input-field font-mono tracking-wider text-center text-lg"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  maxLength={19}
                  style={{ letterSpacing: "0.15em" }}
                />
                <p className="text-[11px] text-muted mt-1.5 ml-1">
                  This key was generated by your Campus Admin. Check your email or contact your admin.
                </p>
              </div>

              {keyError && (
                <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
                  ⚠️ {keyError}
                </div>
              )}

              <button
                type="submit"
                disabled={activating}
                className="btn-primary w-full text-center flex items-center justify-center gap-2"
              >
                {activating ? (
                  <>
                    <span className="animate-spin">⏳</span> Activating...
                  </>
                ) : (
                  <>🔓 Activate & Unlock Wallet</>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-xs text-muted">
                After activation you&apos;ll receive <span className="text-success font-semibold">100 $CAMPUS</span> as a welcome airdrop
                and get your Soulbound Student ID (SBT) minted to your Smart Account.
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <button onClick={handleLogout} className="text-muted text-sm hover:text-white transition-colors">
              ← Sign Out
            </button>
          </div>
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    );
  }

  // ================================================================
  // FULL DASHBOARD — activated student
  // ================================================================
  if (!user) return null;

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
            <div className="text-[11px] text-muted">Student Wallet</div>
          </div>
        </Link>
        <button onClick={() => setActiveTab("wallet")} className={`sidebar-link ${activeTab === "wallet" ? "active" : ""}`}>
          <span>📊</span> Transactions
        </button>
        <button onClick={() => setActiveTab("send")} className={`sidebar-link ${activeTab === "send" ? "active" : ""}`}>
          <span>💸</span> Send Tokens
        </button>
        <button onClick={() => setActiveTab("marketplace")} className={`sidebar-link ${activeTab === "marketplace" ? "active" : ""}`}>
          <span>🛒</span> Marketplace
        </button>
        <button onClick={() => setActiveTab("qr")} className={`sidebar-link ${activeTab === "qr" ? "active" : ""}`}>
          <span>📱</span> Tap-to-Pay
        </button>

        {/* User Info */}
        <div className="mt-auto pt-6 border-t border-white/[0.06]">
          <div className="text-xs text-muted mb-1">{user.universityName}</div>
          <div className="text-sm font-semibold text-white">{user.name}</div>
          <div className="text-xs text-muted mt-0.5">{user.department}</div>
          <div className="text-xs text-muted mt-1">{user.email}</div>
          <button
            onClick={handleLogout}
            className="text-xs text-danger mt-3 hover:underline"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Welcome, {user.name.split(" ")[0]}
              </h1>
              <p className="text-muted mt-1">Your CampusChain Wallet Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge badge-${user.status}`}>{user.status}</span>
              <code className="text-xs text-muted bg-white/5 px-3 py-1.5 rounded-lg">
                {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
              </code>
            </div>
          </div>

          {/* Wallet Card */}
          <div className="relative overflow-hidden rounded-2xl p-8 mb-8"
            style={{
              background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(14,165,233,0.2))",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="text-sm text-white/60 mb-2 font-medium">$CAMPUS Balance</div>
              <div className="text-5xl font-bold text-white tracking-tight mb-4">
                {user.campusBalance.toLocaleString()}
                <span className="text-lg text-white/40 ml-2">$CAMP</span>
              </div>
              <div className="flex gap-6 text-sm flex-wrap">
                <div>
                  <span className="text-white/40">SBT ID:</span>{" "}
                  <code className="text-primary-light">{user.sbtTokenId}</code>
                </div>
                <div>
                  <span className="text-white/40">Department:</span>{" "}
                  <span className="text-secondary-light">{user.department}</span>
                </div>
                <div>
                  <span className="text-white/40">Passkey:</span>{" "}
                  <span className="text-success">✓ Active</span>
                </div>
                <div>
                  <span className="text-white/40">Gas Fees:</span>{" "}
                  <span className="text-secondary-light">0 (Sponsored)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["wallet", "send", "marketplace", "qr"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-primary/20 text-white border border-primary/30"
                    : "text-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {tab === "wallet" && "📊 Transactions"}
                {tab === "send" && "💸 Send Tokens"}
                {tab === "marketplace" && "🛒 Marketplace"}
                {tab === "qr" && "📱 Tap-to-Pay"}
              </button>
            ))}
          </div>

          {/* Tab: Transactions */}
          {activeTab === "wallet" && (
            <div className="animate-fade-in glass-card overflow-hidden">
              {txns.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <p className="text-muted">No transactions yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Gas</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <span className={`badge ${tx.type === "reward" ? "badge-active" : tx.type === "transfer" ? "badge-unused" : "badge-redeemed"}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="text-sm">{tx.description}</td>
                        <td className={`font-semibold ${tx.to === user.walletAddress ? "text-success" : "text-danger"}`}>
                          {tx.to === user.walletAddress ? "+" : "-"}{tx.amount} $CAMP
                        </td>
                        <td>
                          <span className="text-secondary-light text-xs">
                            {tx.gasless ? "⚡ Free" : "Paid"}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-active">{tx.status}</span>
                        </td>
                        <td className="text-sm text-muted">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Send Tokens */}
          {activeTab === "send" && (
            <div className="animate-fade-in glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-2">
                P2P Token Transfer (Gasless)
              </h2>
              <p className="text-muted text-sm mb-6">
                Send $CAMPUS to any registered student. All fees are covered by the Paymaster.
              </p>
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-muted block mb-2">Recipient Email</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="e.g. friend@apsit.edu.in"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted block mb-2">Amount ($CAMPUS)</label>
                    <input
                      type="number"
                      className="input-field"
                      min={1}
                      value={sendAmount}
                      onChange={(e) => setSendAmount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Note (optional)</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Coffee money ☕"
                      value={sendDesc}
                      onChange={(e) => setSendDesc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="text-sm text-muted">
                    Gas Fee: <span className="text-secondary-light font-semibold">0 (Sponsored ⚡)</span>
                  </div>
                  <button type="submit" className="btn-primary">
                    Sign & Send →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Marketplace */}
          {activeTab === "marketplace" && (
            <div className="animate-fade-in">
              {/* New Listing */}
              <div className="glass-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">📦 List an Item (Escrow)</h2>
                <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted block mb-2">Title</label>
                    <input
                      className="input-field"
                      placeholder="e.g. Data Structures Textbook"
                      value={listTitle}
                      onChange={(e) => setListTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Category</label>
                    <select
                      className="select-field"
                      value={listCat}
                      onChange={(e) => setListCat(e.target.value as MarketplaceListing["category"])}
                    >
                      <option value="textbook">📚 Textbook</option>
                      <option value="electronics">💻 Electronics</option>
                      <option value="furniture">🪑 Furniture</option>
                      <option value="other">📦 Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-2">Description</label>
                    <input
                      className="input-field"
                      placeholder="Brief description..."
                      value={listDesc}
                      onChange={(e) => setListDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-muted block mb-2">Price ($CAMPUS)</label>
                      <input
                        type="number"
                        className="input-field"
                        min={1}
                        value={listPrice}
                        onChange={(e) => setListPrice(Number(e.target.value))}
                      />
                    </div>
                    <button type="submit" className="btn-primary whitespace-nowrap">
                      List Item
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.length === 0 ? (
                  <div className="glass-card p-8 text-center col-span-full">
                    <div className="text-3xl mb-3">🛒</div>
                    <p className="text-muted">No items listed yet. Be the first seller!</p>
                  </div>
                ) : (
                  listings.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card p-5 flex flex-col gap-3 transition-all hover:-translate-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">{item.category}</span>
                        <span className={`badge badge-${item.status === "listed" ? "unused" : "redeemed"}`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
                        <span className="text-lg font-bold text-white">
                          {item.price} <span className="text-xs text-muted">$CAMP</span>
                        </span>
                        <span className="text-xs text-muted">by {item.sellerName}</span>
                      </div>
                      {item.sellerId !== user.id && item.status === "listed" && (
                        <button className="btn-primary w-full text-center text-sm mt-1">
                          🔒 Buy with Escrow
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab: QR Pay */}
          {activeTab === "qr" && (
            <div className="animate-fade-in glass-card p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-2">Tap-to-Pay QR Code</h2>
              <p className="text-muted text-sm mb-8">
                Show this QR code at the cafeteria or campus vendor to receive payments instantly.
              </p>
              <div className="inline-block p-6 bg-white rounded-2xl mb-6">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <rect width="180" height="180" fill="white"/>
                  <rect x="10" y="10" width="50" height="50" fill="black" rx="4"/>
                  <rect x="15" y="15" width="40" height="40" fill="white" rx="2"/>
                  <rect x="22" y="22" width="26" height="26" fill="black" rx="2"/>
                  <rect x="120" y="10" width="50" height="50" fill="black" rx="4"/>
                  <rect x="125" y="15" width="40" height="40" fill="white" rx="2"/>
                  <rect x="132" y="22" width="26" height="26" fill="black" rx="2"/>
                  <rect x="10" y="120" width="50" height="50" fill="black" rx="4"/>
                  <rect x="15" y="125" width="40" height="40" fill="white" rx="2"/>
                  <rect x="22" y="132" width="26" height="26" fill="black" rx="2"/>
                  {[70,80,90,100].map((x) =>
                    [10,20,30,40,50,70,80,90,100,120,130,140,150].map((y) => (
                      (x + y) % 3 !== 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" fill="black" rx="1"/> : null
                    ))
                  )}
                  {[10,20,30,40,50,120,130,140,150].map((x) =>
                    [70,80,90,100].map((y) => (
                      (x + y) % 3 !== 1 ? <rect key={`${x}-${y}-h`} x={x} y={y} width="8" height="8" fill="black" rx="1"/> : null
                    ))
                  )}
                  <rect x="72" y="72" width="36" height="36" fill="#6d28d9" rx="8"/>
                  <text x="90" y="96" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">C</text>
                </svg>
              </div>
              <div className="text-sm text-muted mb-2">Your Wallet Address</div>
              <code className="text-white font-mono text-sm bg-white/5 px-4 py-2 rounded-lg">
                {user.walletAddress}
              </code>
              <div className="mt-6 text-xs text-muted">
                Payments are signed with your Passkey and settled gaslessly on-chain.
              </div>
            </div>
          )}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </main>
    </div>
  );
}
