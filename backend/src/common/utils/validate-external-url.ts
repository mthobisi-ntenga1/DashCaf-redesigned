import { BadRequestException } from '@nestjs/common';
import { lookup } from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(lookup);

/**
 * SSRF guard — validates that a URL:
 *   1. Uses http or https (no file://, ftp://, etc.)
 *   2. Does not target a private/loopback IP range after DNS resolution
 *      (prevents DNS-rebinding attacks where a hostname resolves to 127.0.0.1)
 *
 * Throw this guard around any code that fetches a user-supplied URL.
 *
 * @example
 *   const safe = await validateExternalUrl(dto.webhookUrl);
 *   await fetch(safe);
 */
export async function validateExternalUrl(raw: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BadRequestException('Invalid URL format.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new BadRequestException('Only http and https URLs are allowed.');
  }

  const hostname = url.hostname;

  // Reject bare IP literals that are private/loopback without a DNS round-trip
  if (isPrivateIp(hostname)) {
    throw new BadRequestException('URL resolves to a private or loopback address.');
  }

  // Resolve the hostname and check the resulting IP (DNS-rebinding guard)
  try {
    const { address } = await dnsLookup(hostname);
    if (isPrivateIp(address)) {
      throw new BadRequestException('URL resolves to a private or loopback address.');
    }
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException('Unable to resolve URL hostname.');
  }

  return url.toString();
}

/** Returns true if the given IP string is in a private or loopback range. */
function isPrivateIp(ip: string): boolean {
  // Loopback
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) return true;
  // RFC 1918 private ranges
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  // Link-local
  if (ip.startsWith('169.254.')) return true;
  // IPv6 loopback / link-local
  if (ip.toLowerCase().startsWith('fe80')) return true;
  // Localhost aliases
  if (ip === 'localhost') return true;
  return false;
}
