// Send a Web Push notification to one user (or all their devices).
//
// Usage (from another backend function or the client):
//   await base44.functions.invoke('sendPushNotification', {
//     to_user_email: 'someone@example.com',   // OR to_user_id
//     title: 'Tagihan Netflix jatuh tempo besok',
//     body:  'Rp 186.000 · Jangan lupa siapkan saldo',
//     url:   '/Dashboard',
//     tag:   'reminder-netflix'
//   });
//
// Implementation notes:
// - Uses Deno-native Web Crypto (SubtleCrypto) instead of npm:web-push, which
//   depends on Node's crypto.createECDH and is unreliable in Deno.
// - Sends an "aes128gcm" encrypted payload per RFC 8291 + VAPID (RFC 8292).
// - Dead subscriptions (410/404) are auto-deactivated.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.35';

// ─── Base64url helpers ──────────────────────────────────────────────────────
function b64urlToBytes(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}
function utf8(s: string): Uint8Array { return new TextEncoder().encode(s); }

// ─── HKDF (RFC 5869) using Web Crypto ────────────────────────────────────────
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', salt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = await crypto.subtle.sign('HMAC', key, ikm);
  return new Uint8Array(prk);
}
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const one = new Uint8Array([1]);
  const t1 = new Uint8Array(await crypto.subtle.sign('HMAC', key, concat(info, one)));
  return t1.slice(0, length);
}

// ─── ECDH: derive shared secret between local key and subscription's p256dh ─
async function generateEcdhKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}
async function exportRawPublic(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key); // 65 bytes uncompressed (0x04 || X || Y)
  return new Uint8Array(raw);
}
async function importP256Public(raw: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}
async function deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: publicKey }, privateKey, 256);
  return new Uint8Array(bits);
}

// ─── ECDSA (P-256) signer for VAPID JWT ─────────────────────────────────────
async function importVapidPrivateKey(vapidPrivateB64url: string): Promise<CryptoKey> {
  // web-push style: raw 32-byte scalar → need to convert to PKCS8 or JWK.
  // Easiest: import as JWK with d = private, x/y from public key.
  const d = vapidPrivateB64url;
  const pub = b64urlToBytes(Deno.env.get('VAPID_PUBLIC_KEY')!);
  // pub is 65 bytes: 0x04 || X(32) || Y(32)
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  const jwk: JsonWebKey = { kty: 'EC', crv: 'P-256', d, x, y, ext: true };
  return await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}
async function signJwt(header: object, claims: object, privKey: CryptoKey): Promise<string> {
  const h = bytesToB64url(utf8(JSON.stringify(header)));
  const c = bytesToB64url(utf8(JSON.stringify(claims)));
  const data = utf8(`${h}.${c}`);
  const sigBuf = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privKey, data);
  const sig = bytesToB64url(new Uint8Array(sigBuf));
  return `${h}.${c}.${sig}`;
}

// ─── AES-128-GCM payload encryption (RFC 8188 aes128gcm scheme) ──────────────
async function encryptPayload(
  payload: Uint8Array,
  clientPublicRaw: Uint8Array,  // 65 bytes uncompressed
  clientAuth: Uint8Array,       // 16 bytes
): Promise<{ body: Uint8Array; serverPublicRaw: Uint8Array }> {
  const serverKeys = await generateEcdhKeyPair();
  const serverPublicRaw = await exportRawPublic(serverKeys.publicKey);
  const clientPublicKey = await importP256Public(clientPublicRaw);
  const ecdhSecret = await deriveSharedSecret(serverKeys.privateKey, clientPublicKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // PRK_key = HKDF-Extract(auth, ecdhSecret)
  const prkKey = await hkdfExtract(clientAuth, ecdhSecret);
  // key_info = "WebPush: info\0" || ua_public || as_public
  const keyInfo = concat(utf8('WebPush: info\0'), clientPublicRaw, serverPublicRaw);
  // IKM = HKDF-Expand(PRK_key, key_info, 32)
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  // PRK = HKDF-Extract(salt, IKM)
  const prk = await hkdfExtract(salt, ikm);
  // CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cek = await hkdfExpand(prk, utf8('Content-Encoding: aes128gcm\0'), 16);
  // NONCE = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonce = await hkdfExpand(prk, utf8('Content-Encoding: nonce\0'), 12);

  // Plaintext = payload || 0x02 (single-record delimiter)
  const plaintext = concat(payload, new Uint8Array([0x02]));

  const cekKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, cekKey, plaintext);
  const ciphertext = new Uint8Array(ctBuf);

  // Header block: salt(16) || rs(4, big-endian) || idlen(1) || keyid(idlen)
  // keyid = server public key (65 bytes)
  const rs = 4096;
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);
  const idlen = new Uint8Array([serverPublicRaw.length]);
  const header = concat(salt, rsBytes, idlen, serverPublicRaw);

  return { body: concat(header, ciphertext), serverPublicRaw };
}

// ─── VAPID Authorization header ─────────────────────────────────────────────
async function buildVapidAuthHeader(audience: string): Promise<string> {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
  const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@aturpintar.id';

  const header = { typ: 'JWT', alg: 'ES256' };
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  const claims = { aud: audience, exp, sub: subject };
  const privCryptoKey = await importVapidPrivateKey(privateKey);
  const jwt = await signJwt(header, claims, privCryptoKey);
  return `vapid t=${jwt}, k=${publicKey}`;
}

// ─── Send push to one subscription ──────────────────────────────────────────
async function sendOne(sub: { endpoint: string; p256dh: string; auth: string }, payloadStr: string) {
  const clientPublic = b64urlToBytes(sub.p256dh);
  const clientAuth = b64urlToBytes(sub.auth);
  const { body } = await encryptPayload(utf8(payloadStr), clientPublic, clientAuth);

  const u = new URL(sub.endpoint);
  const audience = `${u.protocol}//${u.host}`;
  const authorization = await buildVapidAuthHeader(audience);

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '60',
      'Authorization': authorization,
    },
    body,
  });
  return res;
}

// ─── HTTP Handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const { to_user_email, to_user_id, title, body: msgBody, url, tag, icon } = body || {};
    if (!title) return Response.json({ error: 'title is required' }, { status: 400 });

    const targetEmail = to_user_email || caller.email;
    const targetId = to_user_id || null;
    if (caller.role !== 'admin' && targetEmail !== caller.email && targetId !== caller.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const filter: Record<string, any> = { is_active: true };
    if (targetId) filter.created_by_id = targetId;
    else filter.created_by = targetEmail;

    const subs = await base44.asServiceRole.entities.PushSubscription.filter(filter);
    if (!subs || subs.length === 0) {
      return Response.json({ ok: true, sent: 0, note: 'no active subscriptions' });
    }

    const payload = JSON.stringify({
      title,
      body: msgBody || '',
      url: url || '/Dashboard',
      tag: tag || 'aturpintar-notif',
      icon: icon || undefined,
    });

    let sent = 0;
    let failed = 0;
    let deactivated = 0;

    await Promise.all(subs.map(async (s: any) => {
      try {
        const res = await sendOne({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }, payload);
        if (res.status >= 200 && res.status < 300) {
          sent++;
          base44.asServiceRole.entities.PushSubscription.update(s.id, { last_used_at: new Date().toISOString() }).catch(() => {});
        } else if (res.status === 404 || res.status === 410) {
          deactivated++;
          await base44.asServiceRole.entities.PushSubscription.update(s.id, { is_active: false }).catch(() => {});
        } else {
          failed++;
          const errText = await res.text().catch(() => '');
          console.error(`Push failed [${res.status}] for ${s.endpoint.slice(0, 60)}: ${errText.slice(0, 200)}`);
        }
      } catch (e) {
        failed++;
        console.error('Push exception:', (e as Error)?.message);
      }
    }));

    return Response.json({ ok: true, sent, failed, deactivated });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});