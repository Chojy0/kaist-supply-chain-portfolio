import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadRequestsService } from './upload-requests.service';
import { UploadRequestsController } from './upload-requests.controller';
import { UploadRequest } from './upload-request.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadRequest, User]), UsersModule],
  controllers: [UploadRequestsController],
  providers: [UploadRequestsService],
  exports: [UploadRequestsService],
})
export class UploadRequestsModule {}
