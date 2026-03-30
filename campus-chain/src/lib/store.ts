// Mock data store using localStorage — will be replaced with Supabase in production
// This allows the full prototype to work without any backend

// ---- Types ----

export interface University {
  id: string;
  name: string;
  domain: string;
  website: string;
  phone: string;
  status: "active" | "suspended";
  createdAt: string;
  studentCount: number;
  adminEmail: string;
}

export interface UniversityRequest {
  id: string;
  collegeName: string;
  collegeDomain: string;
  collegeWebsite: string;
  collegePhone: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
}

export interface CampusAdmin {
  id: string;
  name: string;
  email: string;
  password: string;
  universityId: string;
  universityName: string;
  createdAt: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  universityId: string;
  universityName: string;
  status: "unused" | "redeemed" | "revoked";
  redeemedBy?: string;
  createdAt: string;
  redeemedAt?: string;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  password: string;
  universityId: string;
  universityName: string;
  walletAddress: string;
  sbtTokenId: string;
  campusBalance: number;
  licenseKey: string;
  status: "active" | "suspended" | "graduated";
  createdAt: string;
  passkey: boolean;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: "transfer" | "reward" | "escrow" | "fee_payment";
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "escrowed";
  gasless: boolean;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: "textbook" | "electronics" | "furniture" | "other";
  status: "listed" | "escrowed" | "sold" | "cancelled";
  buyerId?: string;
  createdAt: string;
}

export type SessionRole = "super_admin" | "campus_admin" | "student";

export interface Session {
  role: SessionRole;
  email: string;
  universityId?: string;
}

// ---- Super Admin credentials (hardcoded for demo) ----

const SUPER_ADMIN_EMAIL = "superadmin@campuschain.io";
const SUPER_ADMIN_PASSWORD = "admin123";

// ---- Helper Functions ----

function getItem<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function generateLicenseKeyString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += "-";
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateWalletAddress(): string {
  const hex = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += hex.charAt(Math.floor(Math.random() * hex.length));
  }
  return addr;
}

// ============================================================
// SESSION / AUTH
// ============================================================

export function loginSuperAdmin(email: string, password: string): { success: boolean; error?: string } {
  if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
    setSession({ role: "super_admin", email });
    return { success: true };
  }
  return { success: false, error: "Invalid Super Admin credentials." };
}

export function loginCampusAdmin(email: string, password: string): { success: boolean; error?: string } {
  const admins = getCampusAdmins();
  const admin = admins.find((a) => a.email === email && a.password === password);
  if (!admin) return { success: false, error: "Invalid email or password." };
  setSession({ role: "campus_admin", email, universityId: admin.universityId });
  return { success: true };
}

export function loginStudent(email: string, password: string): { success: boolean; error?: string } {
  const students = getStudents();
  const student = students.find((s) => s.email === email && s.password === password);
  if (!student) return { success: false, error: "Invalid email or password." };
  if (student.status === "suspended") return { success: false, error: "Your account has been suspended." };
  setSession({ role: "student", email, universityId: student.universityId });
  return { success: true };
}

export function setSession(session: Session): void {
  if (typeof window !== "undefined") localStorage.setItem("cc_session", JSON.stringify(session));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("cc_session");
  return raw ? JSON.parse(raw) : null;
}

export function logout(): void {
  if (typeof window !== "undefined") localStorage.removeItem("cc_session");
}

export function getSuperAdminEmail(): string {
  return SUPER_ADMIN_EMAIL;
}

// ============================================================
// UNIVERSITY REQUESTS (Campus Admin → Super Admin approval)
// ============================================================

export function getUniversityRequests(): UniversityRequest[] {
  return getItem<UniversityRequest>("cc_uni_requests", []);
}

export function submitUniversityRequest(
  collegeName: string,
  collegeDomain: string,
  collegeWebsite: string,
  collegePhone: string,
  adminName: string,
  adminEmail: string,
  adminPassword: string
): { success: boolean; error?: string } {
  const existing = getUniversityRequests();
  const dup = existing.find(
    (r) => r.collegeDomain.toLowerCase() === collegeDomain.toLowerCase() && r.status === "pending"
  );
  if (dup) return { success: false, error: "A request for this domain is already pending." };

  const unis = getUniversities();
  const domainStr = collegeDomain.startsWith("@") ? collegeDomain : `@${collegeDomain}`;
  const existingUni = unis.find((u) => u.domain.toLowerCase() === domainStr.toLowerCase());
  if (existingUni) return { success: false, error: "This domain is already registered." };

  const req: UniversityRequest = {
    id: generateId(),
    collegeName,
    collegeDomain: domainStr,
    collegeWebsite,
    collegePhone,
    adminName,
    adminEmail,
    adminPassword,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  existing.push(req);
  setItem("cc_uni_requests", existing);
  return { success: true };
}

export function approveUniversityRequest(requestId: string): void {
  const requests = getUniversityRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return;

  const req = requests[idx];
  req.status = "approved";
  setItem("cc_uni_requests", requests);

  // Create the university
  const uni = addUniversity(req.collegeName, req.collegeDomain, req.collegeWebsite, req.collegePhone, req.adminEmail);

  // Create the campus admin account
  const admins = getCampusAdmins();
  admins.push({
    id: generateId(),
    name: req.adminName,
    email: req.adminEmail,
    password: req.adminPassword,
    universityId: uni.id,
    universityName: uni.name,
    createdAt: new Date().toISOString(),
  });
  setItem("cc_campus_admins", admins);
}

export function rejectUniversityRequest(requestId: string, reason: string): void {
  const requests = getUniversityRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx !== -1) {
    requests[idx].status = "rejected";
    requests[idx].rejectionReason = reason;
    setItem("cc_uni_requests", requests);
  }
}

// ============================================================
// CAMPUS ADMINS
// ============================================================

export function getCampusAdmins(): CampusAdmin[] {
  return getItem<CampusAdmin>("cc_campus_admins", []);
}

export function getCampusAdminByEmail(email: string): CampusAdmin | undefined {
  return getCampusAdmins().find((a) => a.email === email);
}

// ============================================================
// UNIVERSITIES (Super Admin)
// ============================================================

export function getUniversities(): University[] {
  return getItem<University>("cc_universities", []);
}

export function addUniversity(
  name: string,
  domain: string,
  website: string = "",
  phone: string = "",
  adminEmail: string = ""
): University {
  const unis = getUniversities();
  const uni: University = {
    id: generateId(),
    name,
    domain: domain.startsWith("@") ? domain : `@${domain}`,
    website,
    phone,
    status: "active",
    createdAt: new Date().toISOString(),
    studentCount: 0,
    adminEmail,
  };
  unis.push(uni);
  setItem("cc_universities", unis);
  return uni;
}

export function toggleUniversityStatus(id: string): void {
  const unis = getUniversities();
  const idx = unis.findIndex((u) => u.id === id);
  if (idx !== -1) {
    unis[idx].status = unis[idx].status === "active" ? "suspended" : "active";
    setItem("cc_universities", unis);
  }
}

export function removeUniversity(id: string): void {
  const unis = getUniversities().filter((u) => u.id !== id);
  setItem("cc_universities", unis);
}

// ============================================================
// LICENSE KEYS (Campus Admin)
// ============================================================

export function getLicenseKeys(universityId?: string): LicenseKey[] {
  const keys = getItem<LicenseKey>("cc_license_keys", []);
  if (universityId) return keys.filter((k) => k.universityId === universityId);
  return keys;
}

export function generateLicenseKeys(
  universityId: string,
  universityName: string,
  count: number
): LicenseKey[] {
  const existing = getItem<LicenseKey>("cc_license_keys", []);
  const newKeys: LicenseKey[] = [];
  for (let i = 0; i < count; i++) {
    const lk: LicenseKey = {
      id: generateId(),
      key: generateLicenseKeyString(),
      universityId,
      universityName,
      status: "unused",
      createdAt: new Date().toISOString(),
    };
    newKeys.push(lk);
  }
  existing.push(...newKeys);
  setItem("cc_license_keys", existing);
  return newKeys;
}

export function revokeLicenseKey(keyId: string): void {
  const keys = getItem<LicenseKey>("cc_license_keys", []);
  const idx = keys.findIndex((k) => k.id === keyId);
  if (idx !== -1) {
    keys[idx].status = "revoked";
    setItem("cc_license_keys", keys);
  }
}

// ============================================================
// STUDENT REGISTRATION
// ============================================================

export function redeemLicenseKey(
  licenseKeyStr: string,
  email: string,
  name: string,
  password: string
): { success: boolean; error?: string; student?: Student } {
  const keys = getItem<LicenseKey>("cc_license_keys", []);
  const keyIdx = keys.findIndex((k) => k.key === licenseKeyStr);

  if (keyIdx === -1) return { success: false, error: "Invalid license key." };
  if (keys[keyIdx].status !== "unused")
    return { success: false, error: "This license key has already been used or revoked." };

  const unis = getUniversities();
  const uni = unis.find((u) => u.id === keys[keyIdx].universityId);
  if (!uni) return { success: false, error: "University not found." };
  if (uni.status === "suspended")
    return { success: false, error: "This university is currently suspended." };

  // Validate domain
  const emailDomain = "@" + email.split("@")[1];
  if (emailDomain.toLowerCase() !== uni.domain.toLowerCase()) {
    return {
      success: false,
      error: `Email domain must be ${uni.domain}. You provided ${emailDomain}.`,
    };
  }

  // Check duplicate
  const existingStudents = getStudents();
  if (existingStudents.find((s) => s.email === email)) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Mark key as redeemed
  keys[keyIdx].status = "redeemed";
  keys[keyIdx].redeemedBy = email;
  keys[keyIdx].redeemedAt = new Date().toISOString();
  setItem("cc_license_keys", keys);

  // Create student
  const students = getItem<Student>("cc_students", []);
  const student: Student = {
    id: generateId(),
    email,
    name,
    password,
    universityId: uni.id,
    universityName: uni.name,
    walletAddress: generateWalletAddress(),
    sbtTokenId: `SBT-${generateId().toUpperCase().substring(0, 8)}`,
    campusBalance: 100,
    licenseKey: licenseKeyStr,
    status: "active",
    createdAt: new Date().toISOString(),
    passkey: true,
  };
  students.push(student);
  setItem("cc_students", students);

  // Update university student count
  const uniIdx = unis.findIndex((u) => u.id === uni.id);
  if (uniIdx !== -1) {
    unis[uniIdx].studentCount++;
    setItem("cc_universities", unis);
  }

  // Create initial airdrop transaction
  const txns = getItem<Transaction>("cc_transactions", []);
  txns.push({
    id: generateId(),
    from: "CampusChain Treasury",
    to: student.walletAddress,
    amount: 100,
    type: "reward",
    description: "Welcome airdrop — 100 $CAMPUS tokens",
    timestamp: new Date().toISOString(),
    status: "completed",
    gasless: true,
  });
  setItem("cc_transactions", txns);

  return { success: true, student };
}

// ============================================================
// STUDENTS
// ============================================================

export function getStudents(universityId?: string): Student[] {
  const students = getItem<Student>("cc_students", []);
  if (universityId) return students.filter((s) => s.universityId === universityId);
  return students;
}

export function getStudentByEmail(email: string): Student | undefined {
  return getStudents().find((s) => s.email === email);
}

export function toggleStudentStatus(studentId: string): void {
  const students = getStudents();
  const idx = students.findIndex((s) => s.id === studentId);
  if (idx !== -1) {
    students[idx].status = students[idx].status === "active" ? "suspended" : "active";
    setItem("cc_students", students);
  }
}

// ============================================================
// TRANSACTIONS
// ============================================================

export function getTransactions(walletAddress?: string): Transaction[] {
  const txns = getItem<Transaction>("cc_transactions", []);
  if (walletAddress) return txns.filter((t) => t.from === walletAddress || t.to === walletAddress);
  return txns;
}

export function transferTokens(
  fromEmail: string,
  toEmail: string,
  amount: number,
  description: string
): { success: boolean; error?: string } {
  const students = getStudents();
  const sender = students.find((s) => s.email === fromEmail);
  const receiver = students.find((s) => s.email === toEmail);

  if (!sender) return { success: false, error: "Sender not found." };
  if (!receiver) return { success: false, error: "Recipient not found." };
  if (sender.status !== "active") return { success: false, error: "Your account is suspended." };
  if (receiver.status !== "active") return { success: false, error: "Recipient's account is suspended." };
  if (sender.campusBalance < amount) return { success: false, error: "Insufficient $CAMPUS balance." };

  const sIdx = students.findIndex((s) => s.id === sender.id);
  const rIdx = students.findIndex((s) => s.id === receiver.id);
  students[sIdx].campusBalance -= amount;
  students[rIdx].campusBalance += amount;
  setItem("cc_students", students);

  const txns = getItem<Transaction>("cc_transactions", []);
  txns.push({
    id: generateId(),
    from: sender.walletAddress,
    to: receiver.walletAddress,
    amount,
    type: "transfer",
    description: description || "P2P Transfer",
    timestamp: new Date().toISOString(),
    status: "completed",
    gasless: true,
  });
  setItem("cc_transactions", txns);
  return { success: true };
}

export function batchRewardStudents(universityId: string, amount: number, reason: string): number {
  const students = getStudents().filter((s) => s.universityId === universityId && s.status === "active");
  const allStudents = getStudents();
  const txns = getItem<Transaction>("cc_transactions", []);

  let rewarded = 0;
  students.forEach((s) => {
    const idx = allStudents.findIndex((st) => st.id === s.id);
    if (idx !== -1) {
      allStudents[idx].campusBalance += amount;
      txns.push({
        id: generateId(),
        from: "CampusChain Treasury",
        to: s.walletAddress,
        amount,
        type: "reward",
        description: reason,
        timestamp: new Date().toISOString(),
        status: "completed",
        gasless: true,
      });
      rewarded++;
    }
  });

  setItem("cc_students", allStudents);
  setItem("cc_transactions", txns);
  return rewarded;
}

// ============================================================
// MARKETPLACE
// ============================================================

export function getListings(): MarketplaceListing[] {
  return getItem<MarketplaceListing>("cc_listings", []);
}

export function createListing(
  sellerId: string,
  sellerName: string,
  title: string,
  description: string,
  price: number,
  category: MarketplaceListing["category"]
): MarketplaceListing {
  const listings = getListings();
  const listing: MarketplaceListing = {
    id: generateId(),
    sellerId,
    sellerName,
    title,
    description,
    price,
    category,
    status: "listed",
    createdAt: new Date().toISOString(),
  };
  listings.push(listing);
  setItem("cc_listings", listings);
  return listing;
}

// ============================================================
// LEGACY HELPERS (kept for backward compat)
// ============================================================

export function setCurrentUser(email: string): void {
  setSession({ role: "student", email });
}

export function getCurrentUser(): Student | undefined {
  const session = getSession();
  if (!session || session.role !== "student") return undefined;
  return getStudentByEmail(session.email);
}
