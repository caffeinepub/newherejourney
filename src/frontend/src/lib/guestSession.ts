// Manages guest session data in localStorage

const GUEST_ID_KEY = 'nhj_guest_id';
const CHURCH_ID_KEY = 'nhj_church_id';

export function getGuestId(): string | null {
  return localStorage.getItem(GUEST_ID_KEY);
}

export function setGuestId(id: string): void {
  localStorage.setItem(GUEST_ID_KEY, id);
}

export function getChurchId(): string | null {
  return localStorage.getItem(CHURCH_ID_KEY);
}

export function setChurchId(id: string): void {
  localStorage.setItem(CHURCH_ID_KEY, id);
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_ID_KEY);
  localStorage.removeItem(CHURCH_ID_KEY);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
