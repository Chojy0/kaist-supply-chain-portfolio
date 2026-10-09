import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import { resolve, sep } from 'path';
import { Controller, Post, Get, Param, UseGuards, ForbiddenException, ConflictException, ServiceUnavailableException, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equals } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/user.entity';
import { LcaDataService } from '../lca-data/lca-data.service';
import { LcaDataStatus } from '../lca-data/lca-data.entity';
import { Anchor } from './anchor.entity';
import { HederaService } from './hedera.service';
import { evidenceHash } from './evidence-hash';
import { ConfigService } from '@nestjs/config';

class AnchorConsent { @Equals(true) publishHash: boolean; }

@Controller('lca-data/:id/anchor')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(private readonly lca: LcaDataService,
    private readonly hedera: HederaService, private readonly config: ConfigService,
    @InjectRepository(Anchor) private readonly anchors: Repository<Anchor>) {}

  private async currentHash(data: Record<string, unknown>) {
    if (data.filePath) {
      const root = resolve(process.cwd(), 'uploads') + sep;
      const path = resolve(String(data.filePath));
      if (!path.startsWith(root)) throw new ConflictException('Invalid evidence storage path');
      try { data.fileHash = createHash('sha256').update(await readFile(path)).digest('hex'); }
      catch { throw new ConflictException('Original evidence file is unavailable'); }
    }
    return evidenceHash(data);
  }

  @Post()
  async anchor(@Param('id') id: string, @CurrentUser() user: User, @Body() consent: AnchorConsent) {
    const data = await this.lca.findOne(id, user.id, user.role);
    if (user.role !== UserRole.TIER1_SUPPLIER) throw new ForbiddenException();
    if (data.status !== LcaDataStatus.APPROVED) throw new ConflictException('Approve the data before publishing its digest');
    if (this.config.get('HEDERA_ENABLED') !== 'true') throw new ServiceUnavailableException('Hedera is disabled');
    const hash = await this.currentHash(data as unknown as Record<string, unknown>);
    const existing = await this.anchors.findOneBy({ id });
    if (existing) {
      if (existing.hash !== hash || existing.status === 'submitting') throw new ConflictException('Existing anchor requires review; automatic resubmission is blocked');
      return existing;
    }
    // The unique key reserves this document before sending any external transaction.
    try { await this.anchors.insert({ id, hash, status: 'submitting' }); }
    catch { throw new ConflictException('Another anchor request exists'); }
    const proof = await this.hedera.submit(hash);
    await this.anchors.update(id, { topicId: proof.topicId, sequenceNumber: proof.sequenceNumber, transactionId: proof.transactionId, status: 'submitted' });
    return { ...proof, status: 'submitted' };
  }

  @Get()
  async verify(@Param('id') id: string, @CurrentUser() user: User) {
    const data = await this.lca.findOne(id, user.id, user.role);
    const proof = await this.anchors.findOneBy({ id });
    if (!proof) return { status: 'not_registered' };
    if (proof.status === 'submitting') return { status: 'confirmation_required' };
    const hash = await this.currentHash(data as unknown as Record<string, unknown>);
    if (hash !== proof.hash) return { status: 'changed', proof };
    const result = await this.hedera.verify(proof.topicId, proof.sequenceNumber, hash);
    return { status: result.pending ? 'pending' : result.matched ? 'verified' : 'mismatch', ...result, proof };
  }
}
