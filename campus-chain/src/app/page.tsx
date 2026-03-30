"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans relative overflow-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg font-black text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tighter">CampusChain</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/request-campus" className="text-zinc-400 hover:text-white transition-colors">
            Register Campus
          </Link>
          <Link
            href="/login"
            className="px-5 py-2 rounded-lg bg-white text-black font-bold border border-white hover:bg-zinc-200 transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 text-center z-10">


        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white max-w-4xl mb-6">
          The{" "}
          <span className="metallic-text">
            CampusChain
          </span>{" "}
          Ecosystem
        </h1>

        <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-12 leading-relaxed font-medium">
          Gasless transactions, biometric passkeys, and soulbound identities.
          A premium Web3 SaaS platform for modern universities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="btn-primary flex items-center justify-center h-14 px-10 text-base"
          >
            🔐 Sign In
          </Link>
          <Link
            href="/register"
            className="btn-secondary flex items-center justify-center h-14 px-8 text-base"
          >
            🎓 Student Registration
          </Link>
          <Link
            href="/request-campus"
            className="btn-secondary flex items-center justify-center h-14 px-8 text-base border-white/5"
          >
            🏛️ Register Your Campus
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mt-24">
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-white mb-2">Passkey Accounts</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              ERC-4337 Account Abstraction with biometric Passkeys. No seed phrases, ever.
            </p>
          </div>
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-white mb-2">Gasless Tokens</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The $CAMPUS token with Paymaster-sponsored transactions. Zero friction.
            </p>
          </div>
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold text-white mb-2">Soulbound IDs</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Non-transferable ERC-721 SBTs serve as revocable digital Student IDs.
            </p>
          </div>
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🔑</div>
            <h3 className="text-lg font-semibold text-white mb-2">Admin License Keys</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Campus Admins generate secure license keys for verified student-only access.
            </p>
          </div>
        </div>

        {/* Second Row Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-6xl mt-5">
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🏛️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Tenant SaaS</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Super Admin registers university domains. Each campus gets isolated access controls.
            </p>
          </div>
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🎁</div>
            <h3 className="text-lg font-semibold text-white mb-2">Learn-to-Earn</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Smart contracts batch-drop tokens for attendance, GPA milestones, or events.
            </p>
          </div>
          <div className="glass-card p-6 text-left transition-all hover:-translate-y-1">
            <div className="text-2xl mb-3">🛒</div>
            <h3 className="text-lg font-semibold text-white mb-2">P2P Escrow Market</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Trustless trading for textbooks and dorm gear with smart contract escrow.
            </p>
          </div>
        </div>

        {/* Architecture Flow */}
        <div className="w-full max-w-4xl mt-24 glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                🏛️
              </div>
              <div className="text-sm font-semibold text-white">Super Admin</div>
              <p className="text-xs text-zinc-500">Registers university domains</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                🔑
              </div>
              <div className="text-sm font-semibold text-white">Campus Admin</div>
              <p className="text-xs text-zinc-500">Generates license keys</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                🎓
              </div>
              <div className="text-sm font-semibold text-white">Student</div>
              <p className="text-xs text-zinc-500">Redeems key + Passkey auth</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                💰
              </div>
              <div className="text-sm font-semibold text-white">Ecosystem</div>
              <p className="text-xs text-zinc-500">Pay, trade, earn — gasless</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-muted border-t border-white/[0.04] z-10">
        CampusChain © {new Date().getFullYear()} — Blockchain-Powered University Financial Ecosystem
      </footer>
    </div>
  );
}
