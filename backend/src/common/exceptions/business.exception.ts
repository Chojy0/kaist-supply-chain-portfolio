import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

/**
 * 비즈니스 로직 예외
 * @description 일반적인 비즈니스 규칙 위반 시 사용
 * @extends {BaseException}
 *
 * @example
 * throw new BusinessException('포인트가 부족합니다', { required: 100, current: 50 });
 */
export class BusinessException extends BaseException {
  /**
   * @param {string} message - 에러 메시지
   * @param {unknown} details - 추가 상세 정보
   */
  constructor(message: string, details?: unknown) {
    super(message, HttpStatus.BAD_REQUEST, details);
  }
}

/**
 * 리소스를 찾을 수 없는 경우 (404)
 * @extends {BaseException}
 *
 * @example
 * throw new NotFoundException('User', 123);
 * // → "User with id '123' not found"
 *
 * @example
 * throw new NotFoundException('설정 파일');
 * // → "설정 파일 not found"
 */
export class NotFoundException extends BaseException {
  /**
   * @param {string} resource - 리소스 이름
   * @param {string | number} identifier - 리소스 식별자 (선택적)
   */
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 인증 실패 (401)
 * @description 로그인 필요 또는 토큰 만료 시 사용
 * @extends {BaseException}
 *
 * @example
 * throw new UnauthorizedException('토큰이 만료되었습니다');
 */
export class UnauthorizedException extends BaseException {
  /**
   * @param {string} message - 에러 메시지 (기본값: "Unauthorized")
   * @param {unknown} details - 추가 상세 정보
   */
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, HttpStatus.UNAUTHORIZED, details);
  }
}

/**
 * 권한 없음 (403)
 * @description 인증은 되었으나 해당 리소스에 접근 권한이 없는 경우
 * @extends {BaseException}
 *
 * @example
 * throw new ForbiddenException('관리자만 접근 가능합니다');
 */
export class ForbiddenException extends BaseException {
  /**
   * @param {string} message - 에러 메시지 (기본값: "Forbidden resource")
   * @param {unknown} details - 추가 상세 정보
   */
  constructor(message: string = 'Forbidden resource', details?: unknown) {
    super(message, HttpStatus.FORBIDDEN, details);
  }
}

/**
 * 중복 리소스 (409)
 * @description 이미 존재하는 리소스를 생성하려 할 때 사용
 * @extends {BaseException}
 *
 * @example
 * throw new ConflictException('User', 'email');
 * // → "User with email already exists"
 */
export class ConflictException extends BaseException {
  /**
   * @param {string} resource - 리소스 이름
   * @param {string} field - 중복된 필드명 (선택적)
   */
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with ${field} already exists`
      : `${resource} already exists`;
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * 유효성 검증 실패 (400)
 * @description DTO 유효성 검사 실패 시 사용
 * @extends {BaseException}
 *
 * @example
 * throw new ValidationException([
 *   { field: 'email', message: '올바른 이메일 형식이 아닙니다' }
 * ]);
 */
export class ValidationException extends BaseException {
  /**
   * @param {unknown} errors - 유효성 검사 에러 목록
   */
  constructor(errors: unknown) {
    super('Validation failed', HttpStatus.BAD_REQUEST, errors);
  }
}

/**
 * 데이터베이스 오류 (500)
 * @description DB 연결 실패, 쿼리 오류 등 데이터베이스 관련 예외
 * @extends {BaseException}
 *
 * @example
 * throw new DatabaseException('데이터베이스 연결 실패', { host: 'localhost' });
 */
export class DatabaseException extends BaseException {
  /**
   * @param {string} message - 에러 메시지 (기본값: "Database error")
   * @param {unknown} details - 추가 상세 정보
   */
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * 외부 서비스 오류 (503)
 * @description 외부 API, 서드파티 서비스 연동 실패 시 사용
 * @extends {BaseException}
 *
 * @example
 * throw new ExternalServiceException('PaymentGateway', '결제 서버 응답 없음');
 */
export class ExternalServiceException extends BaseException {
  /**
   * @param {string} service - 외부 서비스 이름
   * @param {string} message - 에러 메시지 (선택적)
   */
  constructor(service: string, message?: string) {
    super(
      message || `External service '${service}' is unavailable`,
      HttpStatus.SERVICE_UNAVAILABLE,
      { service },
    );
  }
}
