import 'server-only';

import crypto from 'crypto';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function requestFingerprint(identifier: string) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || requestHeaders.get('x-real-ip') || 'unknown';
  return crypto.createHash('sha256').update(`${ip}:${identifier.toLowerCase()}`).digest('hex');
}

/** Limita solicitudes sin bloquear el servicio si el control no está disponible. */
export async function allowRequest(action: string, identifier: string, limit: number, windowSeconds: number) {
  try {
    const fingerprint = await requestFingerprint(identifier);
    const { data, error } = await supabaseAdmin.rpc('check_request_rate_limit', {
      p_action: action,
      p_identifier: fingerprint,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Rate limit no disponible:', error.message);
      return true;
    }
    return Boolean(data);
  } catch (error) {
    console.error('Error comprobando rate limit:', error);
    return true;
  }
}

/** k-anonimato: la contraseña completa nunca sale del servidor. */
export async function isCompromisedPassword(password: string) {
  try {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      headers: { 'Add-Padding': 'true' },
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!response.ok) return false;
    const matches = await response.text();
    return matches.split('\n').some(line => line.trim().split(':')[0] === suffix);
  } catch (error) {
    // Fail-open para no impedir registro o recuperación por un servicio externo.
    console.error('No se pudo comprobar la seguridad de la contraseña:', error);
    return false;
  }
}

