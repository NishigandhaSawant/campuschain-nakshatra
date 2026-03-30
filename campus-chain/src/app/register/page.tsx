"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redeemLicenseKey, setCurrentUser } from "@/lib/store";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passkeyAnimating, setPasskeyAnimating] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [sbtId, setSbtId] = useState("");

  function handleVerifyKey(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!licenseKey.trim() || !email.trim() || !name.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const result = redeemLicenseKey(licenseKey.trim().toUpperCase(), email.trim(), name.trim(), password);
    if (!result.success) {
      setError(result.error || "Invalid key.");
      return;
    }
    setWalletAddress(result.student!.walletAddress);
    setSbtId(result.student!.sbtTokenId);
    setStep(2);
  }

  function handlePasskey() {
    setPasskeyAnimating(true);
    setTimeout(() => {
      setPasskeyAnimating(false);
      setStep(3);
    }, 2500);
  }

  function handleMintSBT() {
    setStep(4);
  }

  function handleGoToDashboard() {
    setCurrentUser(email);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-fade-in">
        <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-white">
            C
          </div>
          <span className="text-xl font-bold text-white tracking-tight">CampusChain</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(109,40,217,0.4)]"
                  : "bg-white/5 text-muted border border-white/10"
              }`}>
                {step > s ? "✓" : s}
              </div>
              {s < 4 && <div className={`w-10 h-0.5 rounded-full ${step > s ? "bg-primary" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: License Key + Email + Password */}
        {step === 1 && (
          <div className="glass-card p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🔑</div>
              <h2 className="text-xl font-bold text-white">Student Registration</h2>
              <p className="text-muted text-sm mt-1">
                Enter your details and the license key from your Campus Admin.
              </p>
            </div>
            <form onSubmit={handleVerifyKey} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-muted block mb-2">Full Name</label>
                <input className="input-field" placeholder="e.g. Jagdish Patel" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted block mb-2">College Email</label>
                <input className="input-field" type="email" placeholder="e.g. student@apsit.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-2">Password</label>
                  <input className="input-field" type="password" placeholder="Min 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-2">Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Re-enter" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-2">License Key</label>
                <input
                  className="input-field font-mono tracking-wider text-center text-lg"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  maxLength={19}
                  style={{ letterSpacing: "0.15em" }}
                />
              </div>
              {error && (
                <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
                  ⚠️ {error}
                </div>
              )}
              <button type="submit" className="btn-primary mt-2 w-full text-center">
                Verify & Continue →
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Passkey */}
        {step === 2 && (
          <div className="glass-card p-8 animate-fade-in text-center">
            <div className="text-5xl mb-4">{passkeyAnimating ? "🔄" : "🛡️"}</div>
            <h2 className="text-xl font-bold text-white mb-2">Create Your Passkey</h2>
            <p className="text-muted text-sm mb-8">
              Your device will create a secure biometric key.<br/>No seed phrases needed.
            </p>
            {passkeyAnimating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary flex items-center justify-center animate-pulse">
                  <span className="text-4xl">👆</span>
                </div>
                <p className="text-primary-light text-sm font-medium animate-pulse">Waiting for biometric verification...</p>
              </div>
            ) : (
              <button onClick={handlePasskey} className="btn-primary w-full text-center">
                🔐 Register Passkey (FaceID / TouchID)
              </button>
            )}
          </div>
        )}

        {/* Step 3: SBT Mint */}
        {step === 3 && (
          <div className="glass-card p-8 animate-fade-in text-center">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-xl font-bold text-white mb-2">Mint Your Soulbound Student ID</h2>
            <p className="text-muted text-sm mb-6">
              A non-transferable NFT (SBT) will be minted to your Smart Account.
            </p>
            <div className="glass-card p-5 mb-6 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted text-xs">Wallet</span>
                  <div className="text-white font-mono text-xs mt-1">{walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Token ID</span>
                  <div className="text-primary-light font-mono text-xs mt-1">{sbtId}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Type</span>
                  <div className="text-white text-xs mt-1">ERC-721 Soulbound</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Transferable</span>
                  <div className="text-danger text-xs mt-1 font-semibold">✕ No</div>
                </div>
              </div>
            </div>
            <button onClick={handleMintSBT} className="btn-primary w-full text-center">
              ⛏️ Mint SBT to My Account (Gasless)
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="glass-card p-8 animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to CampusChain!</h2>
            <p className="text-muted text-sm mb-2">Your Smart Account wallet is ready.</p>
            <p className="text-success font-semibold mb-8">🎉 You received 100 $CAMPUS as a welcome airdrop!</p>
            <div className="glass-card p-4 mb-6 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Wallet</span>
                <code className="text-white font-mono text-xs">{walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}</code>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-muted">SBT</span>
                <code className="text-primary-light font-mono text-xs">{sbtId}</code>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-muted">Balance</span>
                <span className="text-white font-bold">100 $CAMPUS</span>
              </div>
            </div>
            <button onClick={handleGoToDashboard} className="btn-primary w-full text-center">
              Open My Wallet →
            </button>
          </div>
        )}

        <div className="text-center mt-6 space-y-2">
          <Link href="/login" className="text-muted text-sm hover:text-white transition-colors block">
            Already have an account? Sign In →
          </Link>
          <Link href="/" className="text-muted text-sm hover:text-white transition-colors block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
