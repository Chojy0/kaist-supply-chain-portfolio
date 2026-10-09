/**
 * Winston Logger Configuration
 *
 * Winston 로거 설정 파일
 * - 콘솔 및 파일 로깅 지원
 * - 일별 로그 파일 로테이션
 * - 에러 로그 분리 저장
 */
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

/** 로그 파일 저장 디렉토리 */
const logDir = 'logs';

/**
 * 파일 로그 포맷 설정
 *
 * combine()으로 여러 포맷터를 순차적으로 적용:
 * 1. timestamp: 로그 발생 시간 (YYYY-MM-DD HH:mm:ss 형식)
 * 2. errors: 에러 객체의 스택 트레이스 포함
 * 3. splat: %s, %d 등 문자열 보간 지원 (printf 스타일)
 * 4. printf: 최종 로그 문자열 포맷 정의
 *
 * 출력 예시: [2025-11-27 10:30:45] [ERROR] [UserService] 사용자를 찾을 수 없습니다
 */
const logFormat = winston.format.combine(
  // 타임스탬프 추가 - ISO 8601 기반 한국 시간 형식
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // 에러 객체 발생 시 스택 트레이스를 로그에 포함
  winston.format.errors({ stack: true }),
  // printf 스타일 문자열 보간 지원 (예: logger.info('User %s logged in', userId))
  winston.format.splat(),
  // 최종 로그 출력 형식 정의
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      context,
      trace,
    }: {
      timestamp: string;
      level: string;
      message: string;
      context?: string; // NestJS 서비스/컨트롤러 이름
      trace?: string; // 에러 스택 트레이스
    }) => {
      // context: 없으면 'Application' 기본값
      // trace: 있는 경우에만 줄바꿈 후 출력
      return `[${timestamp}] [${level.toUpperCase()}] [${context || 'Application'}] ${message}${trace ? `\n${trace}` : ''}`;
    },
  ),
);

/**
 * 콘솔 로그 포맷 설정 (컬러 출력)
 *
 * NestJS 스타일의 컬러풀한 콘솔 출력:
 * - 로그 레벨별 색상 구분
 * - 가독성 좋은 포맷팅
 * - ms(): 이전 로그와의 시간 차이 표시
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // 이전 로그 대비 경과 시간 표시 (예: +125ms)
  winston.format.ms(),
  // NestJS 스타일 로그 포맷 (앱 이름: OEM-Trace)
  nestWinstonModuleUtilities.format.nestLike('OEM-Trace', {
    colors: true, // 로그 레벨별 색상 적용
    prettyPrint: true, // 객체 로그 시 보기 좋게 출력
  }),
);

/**
 * 일반 로그용 일별 로테이션 파일 Transport
 *
 * - debug 레벨 이상 모든 로그 기록
 * - 매일 새 파일 생성 (application-2025-11-27.log)
 * - 14일 보관 후 자동 삭제
 * - 20MB 초과 시 새 파일 생성
 */
const dailyRotateFileTransport = new DailyRotateFile({
  level: 'debug', // debug, info, warn, error 모두 기록
  filename: `${logDir}/application-%DATE%.log`, // %DATE%는 datePattern으로 치환
  datePattern: 'YYYY-MM-DD', // 일별 로테이션
  zippedArchive: true, // 이전 로그 파일 gzip 압축
  maxSize: '20m', // 파일당 최대 20MB
  maxFiles: '14d', // 14일간 보관
  format: logFormat,
});

/**
 * 에러 로그 전용 일별 로테이션 파일 Transport
 *
 * - error 레벨만 별도 파일에 기록
 * - 에러 추적 및 모니터링 용이
 * - 30일 보관 (일반 로그보다 긴 보관 기간)
 */
const dailyRotateErrorFileTransport = new DailyRotateFile({
  level: 'error', // error 레벨만 기록
  filename: `${logDir}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // 에러 로그는 30일 보관
  format: logFormat,
});

/**
 * Winston Transport 배열
 *
 * 로그가 출력되는 모든 대상(목적지) 정의:
 * 1. Console: 개발 시 터미널 출력
 * 2. DailyRotateFile: 전체 로그 파일
 * 3. DailyRotateFile: 에러 전용 파일
 */
export const winstonTransports = [
  // 콘솔 출력 Transport
  new winston.transports.Console({
    // production: info 이상만, development: debug 이상 모두 출력
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat,
  }),
  // 파일 Transport들
  dailyRotateFileTransport,
  dailyRotateErrorFileTransport,
];

/**
 * Winston 설정 객체 (NestJS 모듈에서 사용)
 *
 * @example
 * // app.module.ts에서 사용
 * WinstonModule.forRoot(winstonConfig)
 */
export const winstonConfig = {
  transports: winstonTransports,
};
