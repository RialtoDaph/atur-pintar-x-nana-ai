// Web Push Notification client helper
import { base44 } from "@/api/base44Client";

/** Convert base64url string to Uint8Array for applicationServerKey */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/** Convert ArrayBuffer to base64url */
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/** Register the service worker (idempotent) */
async function registerServiceWorker() {
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

/**
 * Subscribe current browser to push notifications.
 * Returns { ok: true, subscription } or { ok: false, reason }.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  // Get VAPID public key from backend
  let vapidPublicKey;
  try {
    const res = await base44.functions.invoke('getVapidPublicKey', {});
    vapidPublicKey = res?.data?.publicKey;
  } catch {
    return { ok: false, reason: 'server_error' };
  }
  if (!vapidPublicKey) return { ok: false, reason: 'no_vapid_key' };

  const reg = await registerServiceWorker();

  // Reuse existing subscription if any
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    } catch (e) {
      return { ok: false, reason: 'subscribe_failed' };
    }
  }

  const json = sub.toJSON ? sub.toJSON() : null;
  const p256dh = json?.keys?.p256dh || bufferToBase64Url(sub.getKey('p256dh'));
  const auth = json?.keys?.auth || bufferToBase64Url(sub.getKey('auth'));

  // Save/update on backend (dedupe by endpoint)
  try {
    const existing = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
    if (existing && existing.length > 0) {
      await base44.entities.PushSubscription.update(existing[0].id, {
        p256dh, auth, is_active: true, user_agent: navigator.userAgent,
      });
    } else {
      await base44.entities.PushSubscription.create({
        endpoint: sub.endpoint,
        p256dh, auth,
        user_agent: navigator.userAgent,
        is_active: true,
      });
    }
  } catch {
    return { ok: false, reason: 'save_failed' };
  }

  return { ok: true, subscription: sub };
}

/** Unsubscribe current browser from push. */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready.catch(() => null));
  if (!reg) return { ok: true };
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { ok: true };

  try {
    const existing = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
    for (const row of existing || []) {
      await base44.entities.PushSubscription.delete(row.id).catch(() => {});
    }
  } catch {}

  await sub.unsubscribe();
  return { ok: true };
}

/** Is current browser already subscribed? */
export async function isSubscribed() {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready.catch(() => null));
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}