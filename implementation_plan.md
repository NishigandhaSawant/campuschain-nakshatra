# CampusChain: Final Implementation Plan & Architecture

This document finalizes the architecture and feature set for **CampusChain**, a multi-tenant, blockchain-powered financial ecosystem for universities. It replaces fragmented campus payments with a secure, gasless, and seedless platform.

---

## 1. The Complete Tech Stack

The platform is designed as a modern, high-performance Web application integrating Account Abstraction (Web3) with traditional Web2 authentication and data storage.

### Frontend & UI Layer
- **Framework**: `Next.js 14` (App Router) for server-side rendering, fast routing, and SEO optimization.
- **Styling**: `Tailwind CSS (v4)` with custom CSS (`index.css`) for a premium, dark-mode glassmorphism aesthetic.
- **Animations**: `Framer Motion` for smooth page transitions, micro-interactions, and modal animations.
- **Icons & Typography**: Modern system-fonts and emoji-based iconography for lightweight, consistent visuals.

### Data & Backend Layer (Current: Local Mock -> Target: Supabase)
- **Current State**: A robust `localStorage`-backed mock store (`src/lib/store.ts`) simulating a relational database. It handles complex relationships (Universities -> Campus Admins -> Students -> Transactions -> Listings).
- **Production Target**: `Supabase` (PostgreSQL + Auth).
  - **Authentication**: `Supabase Auth` for Email/Password login.
  - **Database**: `PostgreSQL` with Row-Level Security (RLS) ensuring strict multi-tenant data isolation (e.g., Campus A cannot see Campus B's data).

### Web3 & Blockchain Layer (Target Architecture)
- **Account Abstraction (ERC-4337)**: `Biconomy` or `Alchemy AccountKit` to create Smart Accounts for students.
- **Authentication**: `WebAuthn` (Passkeys / FaceID / TouchID) mapped to Smart Accounts to completely eliminate seed phrases.
- **Smart Contracts (Solidity)**:
  - `CampusToken.sol`: Custom ERC-20 token ($CAMPUS) for the campus economy.
  - `StudentLicense.sol`: Soulbound Token (SBT / ERC-721) acting as a non-transferable digital ID.
  - `Paymaster.sol`: Sponsoring gas fees so students never pay native tokens (ETH/MATIC) to transact.

---

## 2. Core Features by Role

### A. The Super Admin (Platform Owner)
*The central authority managing university onboarding.*
- **Feature**: Review and approve/reject incoming university requests.
- **Feature**: Auto-provision new universities and their root Campus Admin accounts upon approval.
- **Tech Used**: Next.js Server Components, React State, Data isolation patterns.

### B. The Campus Admin (University IT/Staff)
*The localized authority managing a specific university's economy.*
- **Feature (New Accounts)**: View all pending student registrations tied to their university.
- **Feature (Domain Validation)**: Auto-verification of student emails against the university's registered domain (e.g., `@apsit.edu.in`).
- **Feature (Key Generation)**: Bulk approval of valid students, triggering auto-generation of unique License Keys.
- **Feature (Export)**: Secure CSV export of approved students and their license keys for secure offline distribution.
- **Feature (Selective Rewards)**: A "Learn-to-Earn" dashboard to distribute $CAMPUS tokens. Admins can filter by department (e.g., Computer Science), select specific students via checkboxes, and execute targeted batch airdrops with attached reasoning.
- **Tech Used**: React `useCallback`, `Set` for bulk selection, CSV Blob generation, array filtering/mapping.

### C. The Student (End User)
*The daily active user participating in the campus economy.*
- **Feature (Registration)**: 2-Phase registration. First, submit basic details (Name, College Email, Department, Password). Wait for admin approval.
- **Feature (Activation Gate)**: Upon receiving the License Key from the admin, entering it in the dashboard to unlock the Smart Account.
- **Feature (Wallet & Airdrop)**: Viewing $CAMPUS balance, transaction history, and receiving an automatic 100 $CAMPUS genesis airdrop upon activation.
- **Feature (P2P Transfers)**: Gasless token transfers to peers via email lookup.
- **Feature (Marketplace)**: Listing items (e.g., textbooks, electronics) for sale with escrow protection.
- **Tech Used**: CSS Glassmorphism cards, React Forms, simulated latency for blockchain transaction UX.

---

## 3. The End-to-End Onboarding Process Flow

1. **University Registration**: A college representative requests access at `/request-campus`.
2. **Platform Approval**: The Super Admin approves the request, creating the University and its Campus Admin.
3. **Student Signup**: A student registers at `/register` using their official college email.
4. **Campus Admin Validation**: The Campus Admin views the "New Accounts" tab, sees the domain is valid, selects the student, and generates a License Key.
5. **Key Handover**: The Admin exports the CSV and securely shares the key with the student.
6. **Student Activation**: The student logs in, enters the License Key, and their Smart Wallet (and SBT) is activated.

---

## 4. Next Implementation Steps (Post-Prototype)

> [!IMPORTANT]
> The UI, User Experience, and Business Logic are fully implemented and verified in the prototype. The next major technical phase requires migrating the data layer.

1. **Supabase Migration**: Translate `src/lib/store.ts` into a proper Supabase PostgreSQL schema with RLS policies.
2. **Smart Contract Deployment**: Write, test (Foundry/Hardhat), and deploy the foundational ERC-4337 and Token contracts to a testnet (e.g., Base Sepolia or Polygon Amoy).
3. **Web3 SDK Integration**: Wire the frontend transaction buttons to sign and submit actual UserOperations via the chosen Paymaster/Bundler provider.
