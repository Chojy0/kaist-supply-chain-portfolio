import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/users/user.entity';

async function bootstrap() {
  if (process.env.NODE_ENV !== 'development') throw new Error('Demo accounts are only allowed in development');
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  try {
    if (!await userRepository.findOneBy({email: 'outside@test.com'})) await usersService.create('outside@test.com', 'password123', 'Access test account', UserRole.TIER1_SUPPLIER);

    // Create Tier 1 Supplier (1차 협력사)
    let tier1User = await userRepository.findOne({ where: { email: 'tier1@test.com' } });
    if (!tier1User) {
      tier1User = await usersService.create(
        'tier1@test.com',
        'password123',
        '1차 협력사 테스트 사용자',
        UserRole.TIER1_SUPPLIER,
      );
      console.log('✅ 1차 협력사 사용자 생성 완료:', tier1User.email);
    } else {
      console.log('ℹ️  1차 협력사 사용자 이미 존재:', tier1User.email);
    }

    // Create Tier 2+ Supplier (2차 이상 협력사)
    let tier2User = await userRepository.findOne({ where: { email: 'tier2@test.com' } });
    if (!tier2User) {
      tier2User = await usersService.create(
        'tier2@test.com',
        'password123',
        '2차 이상 협력사 테스트 사용자',
        UserRole.TIER2PLUS_SUPPLIER,
      );
      console.log('✅ 2차 이상 협력사 사용자 생성 완료:', tier2User.email);
    } else {
      console.log('ℹ️  2차 이상 협력사 사용자 이미 존재:', tier2User.email);
    }

    // 2차 이상 협력사의 parentSupplierId 설정
    if (tier2User.parentSupplierId !== tier1User.id) {
      tier2User.parentSupplierId = tier1User.id;
      await userRepository.save(tier2User);
      console.log('✅ 2차 이상 협력사의 상위 협력사 설정 완료');
    } else {
      console.log('ℹ️  상위 협력사 관계 이미 설정됨');
    }

    console.log('\n📝 테스트 계정 정보:');
    console.log('1차 협력사: tier1@test.com / password123');
    console.log('2차 이상 협력사: tier2@test.com / password123');
  } catch (error: any) {
    if (error.code === '23505') {
      console.log('⚠️  사용자가 이미 존재합니다.');
    } else {
      console.error('❌ 오류:', error.message);
      console.error(error.stack);
    }
  } finally {
    await app.close();
  }
}

bootstrap();

