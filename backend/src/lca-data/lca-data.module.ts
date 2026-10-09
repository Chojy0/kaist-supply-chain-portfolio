import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LcaDataService } from './lca-data.service';
import { LcaDataController } from './lca-data.controller';
import { LcaData } from './lca-data.entity';
import { UsersModule } from '../users/users.module';
import { UploadRequestsModule } from '../upload-requests/upload-requests.module';
import { User } from '../users/user.entity';
import { UploadRequest } from '../upload-requests/upload-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LcaData, User, UploadRequest]),
    UsersModule,
    UploadRequestsModule,
  ],
  controllers: [LcaDataController],
  providers: [LcaDataService],
  exports: [LcaDataService],
})
export class LcaDataModule {}
