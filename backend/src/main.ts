import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonLogger } from 'nest-winston';

/**
 * 애플리케이션 부트스트랩 함수
 * @description NestJS 애플리케이션을 생성하고 필요한 설정을 초기화
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Winston Logger 설정
   * @description 기본 Logger 대신 Winston을 사용하여 구조화된 로깅 제공
   */
  const logger = app.get<WinstonLogger>(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  /**
   * Global Interceptor 설정
   * @description AOP 방식으로 모든 요청/응답에 대한 로깅 처리
   */
  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  /**
   * Global Exception Filter 설정
   * @description 모든 예외를 일관된 형식으로 처리하여 클라이언트에 반환
   */
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  /**
   * Global Validation Pipe 설정
   * @description 모든 요청에 대해 DTO 유효성 검사 수행
   * @property {boolean} whitelist - DTO에 정의되지 않은 속성 자동 제거
   * @property {boolean} forbidNonWhitelisted - 허용되지 않은 속성이 있으면 요청 거부
   * @property {boolean} transform - 요청 데이터를 DTO 클래스 인스턴스로 자동 변환
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Swagger API 문서 설정
   * @description OpenAPI 스펙 기반의 API 문서 자동 생성
   * @see http://localhost:{port}/api - Swagger UI 접속 경로
   */
  const config = new DocumentBuilder()
    .setTitle('OEM Trace API')
    .setDescription('OEM Trace Server API Documentation')
    .setVersion('1.0')
    /**
     * OAuth2 인증 설정
     * @description Password Grant 방식의 OAuth2 인증 지원
     */
    .addOAuth2(
      {
        type: 'oauth2',
        flows: {
          password: {
            tokenUrl: '/oauth/token',
            scopes: {},
          },
        },
      },
      'oauth2',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  /**
   * CORS 설정
   * @description Cross-Origin Resource Sharing 활성화로 다른 도메인에서의 API 접근 허용
   */
  app.enableCors({origin: (process.env.CORS_ORIGINS || 'http://127.0.0.1:5179,http://localhost:5179').split(',')});
  // 특정 origin만 허용하려면 아래 설정 사용
  // app.enableCors({
  //   origin: ['http://localhost:5173', 'http://localhost:5174'],
  //   credentials: true,
  // });

  /**
   * 서버 시작
   * @description 환경변수 PORT 또는 기본값 3000번 포트에서 서버 실행
   */
  const port = process.env.PORT || 3000;
  await app.listen(port, process.env.HOST || '127.0.0.1');

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}

void bootstrap();
