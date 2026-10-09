import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';
import { UploadRequest } from '../src/upload-requests/upload-request.entity';
import { LcaData } from '../src/lca-data/lca-data.entity';
import { Feedback } from '../src/feedback/feedback.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'oem_trace',
  entities: [User, UploadRequest, LcaData, Feedback],
  synchronize: false,
});

async function checkDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('📊 데이터베이스 연결 성공\n');

    // 사용자 확인
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();
    console.log(`👥 사용자 수: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    // 업로드 요청 확인
    const requestRepository = AppDataSource.getRepository(UploadRequest);
    const requests = await requestRepository.find({
      relations: ['tier1Supplier', 'tier2plusSupplier'],
    });
    console.log(`\n📤 업로드 요청 수: ${requests.length}`);
    requests.forEach(req => {
      console.log(`  - ${req.productName} (${req.tier1Supplier.name} → ${req.tier2plusSupplier.name}) - ${req.status}`);
    });

    // LCA 데이터 확인
    const lcaRepository = AppDataSource.getRepository(LcaData);
    const lcaData = await lcaRepository.find({
      relations: ['supplier', 'tier1Supplier'],
    });
    console.log(`\n📄 LCA 데이터 수: ${lcaData.length}`);
    lcaData.forEach(data => {
      console.log(`  - ${data.productName} (${data.supplier.name} → ${data.tier1Supplier.name}) - ${data.status} - ${data.fileName || 'N/A'}`);
    });

    // 피드백 확인
    const feedbackRepository = AppDataSource.getRepository(Feedback);
    const feedbacks = await feedbackRepository.find({
      relations: ['tier1Supplier', 'lcaData'],
    });
    console.log(`\n💬 피드백 수: ${feedbacks.length}`);
    feedbacks.forEach(fb => {
      console.log(`  - ${fb.tier1Supplier.name} → ${fb.lcaData.productName} - ${fb.type}`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ 데이터베이스 확인 완료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkDatabase();

