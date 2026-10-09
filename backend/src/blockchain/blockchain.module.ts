import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LcaDataModule } from '../lca-data/lca-data.module';
import { Anchor } from './anchor.entity';
import { BlockchainController } from './blockchain.controller';
import { HederaService } from './hedera.service';

@Module({ imports: [LcaDataModule, TypeOrmModule.forFeature([Anchor])], controllers: [BlockchainController], providers: [HederaService] })
export class BlockchainModule {}
