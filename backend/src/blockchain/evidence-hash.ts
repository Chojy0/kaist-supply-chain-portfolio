import { createHash } from 'crypto';

export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().filter(k => object[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(object[k])}`).join(',')}}`;
}

export function evidenceHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(canonical({
    version: 1, fileHash: data.fileHash ?? null,
    productName: data.productName, inventoryData: data.inventoryData ?? null,
    impactAssessment: data.impactAssessment ?? null,
    functionalUnit: data.functionalUnit ?? null, referenceYear: data.referenceYear ?? null,
    dataQuality: data.dataQuality ?? null,
  })).digest('hex');
}

export function anchorMessage(hash: string): string {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid SHA-256 digest');
  return JSON.stringify({ schema: 'oem-trace-v1', sha256: hash });
}

export function matchesAnchor(encoded: string, expected: string): boolean {
  try {
    const message = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    return message.schema === 'oem-trace-v1' && message.sha256 === expected;
  } catch { return false; }
}
