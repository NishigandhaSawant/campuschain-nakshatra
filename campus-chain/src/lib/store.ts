// Mock data store using localStorage — will be replaced with Supabase in production
// This allows the full prototype to work without any backend

// ---- Types ----

export type Department =
  | "Data Science"
  | "AIML"
  | "IT"
  | "Computer Science"
  | "Civil"
  | "Mechanical"
  | "Electronics"
  | "Electrical"
  | "Other";

export const DEPARTMENTS: Department[] = [
  "Data Science",
  "AIML",
  "IT",
  "Computer Science",
  "Civil",
  "Mechanical",
  "Electronics",
  "Electrical",
  "Other",
];

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
  assignedTo?: string;
  assignedToName?: string;
  redeemedBy?: string;
  createdAt: string;
  redeemedAt?: string;
}

// A student who has registered but has NOT yet been approved / given a key
export interface PendingStudent {
  id: string;
  name: string;
  email: string;
  password: string;
  department: Department;
  status: "pending" | "approved" | "rejected";
  domainValid: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  email: string;
  name: string;
  password: string;
  department: Department;
  universityId: string;
  universityName: string;
  walletAddress: string;
  sbtTokenId: string;
  campusBalance: number;
  licenseKey: string;
  status: "active" | "suspended" | "graduated";
  createdAt: string;
  passkey: boolean;
  activated: boolean; // becomes true once student redeems key in dashboard
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
  // First check if user is a fully activated student
  const students = getStudents();
  const student = students.find((s) => s.email === email && s.password === password);
  if (student) {
    if (student.status === "suspended") return { success: false, error: "Your account has been suspended." };
    setSession({ role: "student", email, universityId: student.universityId });
    return { success: true };
  }

  // Check if they are a pending student (registered but not yet approved)
  const pending = getPendingStudents();
  const ps = pending.find((p) => p.email === email && p.password === password);
  if (ps) {
    if (ps.status === "pending") {
      return { success: false, error: "Your registration is pending approval from your Campus Admin. Please wait." };
    }
    if (ps.status === "rejected") {
      return { success: false, error: "Your registration was rejected. Please contact your Campus Admin." };
    }
    // If approved but they haven't activated yet — let them in to enter the key
    setSession({ role: "student", email });
    return { success: true };
  }

  return { success: false, error: "Invalid email or password. Have you registered yet?" };
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
// PENDING STUDENTS (Register first → Campus Admin approves → Key assigned)
// ============================================================

export function getPendingStudents(): PendingStudent[] {
  return getItem<PendingStudent>("cc_pending_students", []);
}

export function registerPendingStudent(
  name: string,
  email: string,
  password: string,
  department: Department
): { success: boolean; error?: string } {
  // Check duplicate
  const existing = getPendingStudents();
  if (existing.find((p) => p.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "An account with this email already exists." };
  }
  const fullStudents = getStudents();
  if (fullStudents.find((s) => s.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "An account with this email already exists." };
  }

  // Check if the email domain matches any registered university
  const emailDomain = "@" + email.split("@")[1];
  const unis = getUniversities();
  const matchedUni = unis.find((u) => u.domain.toLowerCase() === emailDomain.toLowerCase());
  const domainValid = !!matchedUni;

  const ps: PendingStudent = {
    id: generateId(),
    name,
    email,
    password,
    department,
    status: "pending",
    domainValid,
    createdAt: new Date().toISOString(),
  };
  existing.push(ps);
  setItem("cc_pending_students", existing);
  return { success: true };
}

/** Campus Admin approves selected pending students:
 *  - generates a license key per student
 *  - creates a full Student record (but not activated until they enter the key)
 *  - returns the list for CSV export
 */
export function approvePendingStudents(
  pendingIds: string[],
  universityId: string,
  universityName: string
): { name: string; email: string; department: string; licenseKey: string }[] {
  const pending = getPendingStudents();
  const allKeys = getItem<LicenseKey>("cc_license_keys", []);
  const students = getItem<Student>("cc_students", []);
  const unis = getUniversities();
  const results: { name: string; email: string; department: string; licenseKey: string }[] = [];

  pendingIds.forEach((pid) => {
    const idx = pending.findIndex((p) => p.id === pid);
    if (idx === -1) return;
    const ps = pending[idx];

    const keyStr = generateLicenseKeyString();

    // Create LicenseKey record
    const lk: LicenseKey = {
      id: generateId(),
      key: keyStr,
      universityId,
      universityName,
      status: "unused",
      assignedTo: ps.email,
      assignedToName: ps.name,
      createdAt: new Date().toISOString(),
    };
    allKeys.push(lk);

    // Create Student record (not yet activated)
    const student: Student = {
      id: generateId(),
      email: ps.email,
      name: ps.name,
      password: ps.password,
      department: ps.department,
      universityId,
      universityName,
      walletAddress: generateWalletAddress(),
      sbtTokenId: `SBT-${generateId().toUpperCase().substring(0, 8)}`,
      campusBalance: 0,
      licenseKey: keyStr,
      status: "active",
      createdAt: new Date().toISOString(),
      passkey: false,
      activated: false,
    };
    students.push(student);

    // Update university student count
    const uniIdx = unis.findIndex((u) => u.id === universityId);
    if (uniIdx !== -1) {
      unis[uniIdx].studentCount++;
    }

    // Mark pending as approved
    pending[idx].status = "approved";

    results.push({
      name: ps.name,
      email: ps.email,
      department: ps.department,
      licenseKey: keyStr,
    });
  });

  setItem("cc_pending_students", pending);
  setItem("cc_license_keys", allKeys);
  setItem("cc_students", students);
  setItem("cc_universities", unis);

  return results;
}

export function rejectPendingStudent(pendingId: string): void {
  const pending = getPendingStudents();
  const idx = pending.findIndex((p) => p.id === pendingId);
  if (idx !== -1) {
    pending[idx].status = "rejected";
    setItem("cc_pending_students", pending);
  }
}

// ============================================================
// ACTIVATE STUDENT (student enters their license key in the dashboard)
// ============================================================

export function activateStudentWithKey(
  email: string,
  licenseKeyStr: string
): { success: boolean; error?: string; student?: Student } {
  const students = getItem<Student>("cc_students", []);
  const sIdx = students.findIndex((s) => s.email.toLowerCase() === email.toLowerCase());
  if (sIdx === -1) return { success: false, error: "Student record not found." };

  const student = students[sIdx];
  if (student.activated) return { success: false, error: "Your account is already activated." };
  if (student.licenseKey !== licenseKeyStr) {
    return { success: false, error: "Invalid license key. Please check the key provided by your Campus Admin." };
  }

  // Mark key as redeemed
  const keys = getItem<LicenseKey>("cc_license_keys", []);
  const kIdx = keys.findIndex((k) => k.key === licenseKeyStr);
  if (kIdx !== -1) {
    keys[kIdx].status = "redeemed";
    keys[kIdx].redeemedBy = email;
    keys[kIdx].redeemedAt = new Date().toISOString();
    setItem("cc_license_keys", keys);
  }

  // Activate student
  students[sIdx].activated = true;
  students[sIdx].passkey = true;
  students[sIdx].campusBalance = 100;
  setItem("cc_students", students);

  // Create airdrop transaction
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

  return { success: true, student: { ...students[sIdx] } };
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
// STUDENTS
// ============================================================

export function getStudents(universityId?: string): Student[] {
  const students = getItem<Student>("cc_students", []);
  if (universityId) return students.filter((s) => s.universityId === universityId);
  return students;
}

export function getStudentByEmail(email: string): Student | undefined {
  return getStudents().find((s) => s.email.toLowerCase() === email.toLowerCase());
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
  if (!sender.activated) return { success: false, error: "Please activate your account first." };
  if (!receiver.activated) return { success: false, error: "Recipient has not activated their account." };
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
  const students = getStudents().filter(
    (s) => s.universityId === universityId && s.status === "active" && s.activated
  );
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

/** Reward only specific students by their IDs */
export function rewardSelectedStudents(studentIds: string[], amount: number, reason: string): number {
  const allStudents = getStudents();
  const txns = getItem<Transaction>("cc_transactions", []);

  let rewarded = 0;
  studentIds.forEach((sid) => {
    const idx = allStudents.findIndex((s) => s.id === sid);
    if (idx !== -1 && allStudents[idx].activated && allStudents[idx].status === "active") {
      allStudents[idx].campusBalance += amount;
      txns.push({
        id: generateId(),
        from: "CampusChain Treasury",
        to: allStudents[idx].walletAddress,
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
