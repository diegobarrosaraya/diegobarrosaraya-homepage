// Compares by month: a certificate is active through its expiry month.
export function activeCertificates<T extends { expires?: string }>(certs: T[], today: string): T[] {
  return certs.filter((c) => !c.expires || c.expires.slice(0, 7) >= today.slice(0, 7));
}
