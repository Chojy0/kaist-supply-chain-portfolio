import { evidenceHash, anchorMessage, matchesAnchor } from './evidence-hash';

describe('evidence commitments', () => {
  it('ignores JSON key order but detects changed data', () => {
    const a = evidenceHash({ productName: 'sample', inventoryData: { a: 1, b: 2 } });
    expect(a).toBe(evidenceHash({ inventoryData: { b: 2, a: 1 }, productName: 'sample' }));
    expect(a).not.toBe(evidenceHash({ productName: 'sample', inventoryData: { a: 2, b: 2 } }));
  });
  it('publishes only schema and digest', () => {
    const hash = evidenceHash({ productName: 'confidential', fileHash: 'abc' });
    expect(Object.keys(JSON.parse(anchorMessage(hash)))).toEqual(['schema', 'sha256']);
    expect(anchorMessage(hash)).not.toContain('confidential');
  });
  it('rejects unrelated, malformed and altered mirror records', () => {
    const hash = evidenceHash({ productName: 'sample' });
    const encoded = Buffer.from(anchorMessage(hash)).toString('base64');
    expect(matchesAnchor(encoded, hash)).toBe(true);
    expect(matchesAnchor(encoded, '0'.repeat(64))).toBe(false);
    expect(matchesAnchor('invalid', hash)).toBe(false);
    expect(matchesAnchor(Buffer.from('{}').toString('base64'), hash)).toBe(false);
  });
});
