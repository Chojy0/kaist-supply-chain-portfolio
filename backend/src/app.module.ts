import { BlockchainModule } from './blockchain/blockchain.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UploadRequestsModule } from './upload-requests/upload-requests.module';
import { LcaDataModule } from './lca-data/lca-data.module';
import { FeedbackModule } from './feedback/feedback.module';
import { getDatabaseConfig } from './config/database.config';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    BlockchainModule,
    AuthModule,
    UsersModule,
    FeedbackModule,
    LcaDataModule,
    UploadRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService, LoggingInterceptor, AllExceptionsFilter],
})
export class AppModule {}
