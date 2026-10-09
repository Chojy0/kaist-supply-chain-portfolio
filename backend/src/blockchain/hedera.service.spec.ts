jest.mock('@hiero-ledger/sdk', () => ({}));
import { ConfigService } from '@nestjs/config';
import { HederaService } from './hedera.service';
import { anchorMessage } from './evidence-hash';

describe('Hedera gateway', () => {
  const original = global.fetch;
  afterEach(() => { global.fetch = original; });
  it('does not submit when disabled or incompletely configured', async () => {
    await expect(new HederaService(new ConfigService({})).submit('a'.repeat(64))).rejects.toThrow('disabled');
    await expect(new HederaService(new ConfigService({ HEDERA_ENABLED: 'true' })).submit('a'.repeat(64))).rejects.toThrow('incomplete');
  });
  it('distinguishes mirror delay, matching evidence and mismatch', async () => {
    const service = new HederaService(new ConfigService({}));
    global.fetch = jest.fn().mockResolvedValue({ status: 404 }) as any;
    expect(await service.verify('0.0.123','1','a'.repeat(64))).toEqual({ matched: false, pending: true });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ topic_id: '0.0.123', sequence_number: 1, message: Buffer.from(anchorMessage('a'.repeat(64))).toString('base64'), consensus_timestamp: '123.456' }) }) as any;
    expect((await service.verify('0.0.123','1','a'.repeat(64))).matched).toBe(true);
    expect((await service.verify('0.0.123','1','b'.repeat(64))).matched).toBe(false);
  });
  it('rejects URL injection without network access', async () => {
    global.fetch = jest.fn() as any;
    expect((await new HederaService(new ConfigService({})).verify('../../x','1','a'.repeat(64))).matched).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
