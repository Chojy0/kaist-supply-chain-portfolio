import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 에러 응답 인터페이스
 * @description 클라이언트에 반환되는 에러 응답의 표준 구조
 */
export interface ErrorResponse {
  /** HTTP 상태 코드 */
  statusCode: number;
  /** 에러 메시지 */
  message: string;
  /** HTTP 상태 텍스트 (예: "NOT_FOUND", "BAD_REQUEST") */
  error: string;
  /** 에러 발생 시각 (ISO 8601 형식) */
  timestamp: string;
  /** 요청 경로 (선택적) */
  path?: string;
  /** 추가 에러 상세 정보 (선택적) */
  details?: unknown;
}

/**
 * 기본 예외 클래스
 * @description 모든 커스텀 예외의 베이스 클래스로, 표준화된 에러 응답 구조를 제공
 * @extends {HttpException}
 *
 * @example
 * // 기본 사용
 * throw new BaseException('Something went wrong');
 *
 * @example
 * // 상태 코드와 상세 정보 지정
 * throw new BaseException(
 *   'User not found',
 *   HttpStatus.NOT_FOUND,
 *   { userId: 123 }
 * );
 */
export class BaseException extends HttpException {
  /**
   * BaseException 생성자
   * @param {string} message - 에러 메시지
   * @param {HttpStatus} statusCode - HTTP 상태 코드 (기본값: 500)
   * @param {unknown} details - 추가 에러 상세 정보 (선택적)
   */
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: unknown,
  ) {
    super(
      {
        statusCode,
        message,
        error: HttpStatus[statusCode],
        timestamp: new Date().toISOString(),
        details,
      },
      statusCode,
    );
  }
}
