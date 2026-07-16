export interface Member {
  id: string;
  name: string;
  phone: string;
  company: string;
  staff_id: string;
  referral_code?: string;
}

export interface Wallet {
  balance: number;
  monthly_allowance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export interface MeResponse {
  member: Member;
  wallet: Wallet;
  transactions: Transaction[];
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("heraa_session");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("heraa_session");
  localStorage.removeItem("heraa_member_id");
}

export async function fetchMe(): Promise<MeResponse | null> {
  const token = getSessionToken();
  if (!token) return null;

  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    clearSession();
    return null;
  }

  return res.json();
}
