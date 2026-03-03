import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../api/firebase';

// Username validation regex (ASCII only, disallow spaces and diacritics)
export const USERNAME_REGEX = /^[a-z0-9._-]+$/;

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

export function isUsernameFormatValid(username: string): { valid: boolean; reason?: string } {
  if (!username) return { valid: false, reason: 'Kullanıcı adı boş olamaz' };
  const n = normalizeUsername(username);
  if (n.length < 3 || n.length > 20) {
    return { valid: false, reason: 'Kullanıcı adı 3-20 karakter olmalıdır' };
  }
  if (!USERNAME_REGEX.test(n)) {
    return { valid: false, reason: 'Kullanıcı adı sadece ASCII harfler, rakamlar, alt çizgi, nokta ve tire içerebilir' };
  }
  return { valid: true };
}

// Checks if a username is available. username is treated case-insensitively via 'usernameLower'.
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  if (!username) return false;
  const normalized = normalizeUsername(username);
  // Basic format check to avoid unnecessary DB calls
  if (!USERNAME_REGEX.test(normalized)) return false;
  if (normalized.length < 3 || normalized.length > 20) return false;
  try {
    const q = query(
      collection(db, 'profiles'),
      where('usernameLower', '==', normalized),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return true;
    const doc = snap.docs[0];
    const existingId = doc.id;
    if (excludeUserId && existingId === excludeUserId) return true;
    return false;
  } catch (e) {
    console.error('Username availability check failed', e);
    return false;
  }
}
