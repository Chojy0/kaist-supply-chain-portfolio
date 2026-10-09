import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * HTTP 요청/응답 로깅 인터셉터
 * @description 모든 HTTP 요청과 응답을 가로채어 로깅하는 인터셉터
 * @implements {NestInterceptor}
 *
 * @example
 * // main.ts에서 전역 인터셉터로 등록
 * const logger = app.get(WINSTON_MODULE_PROVIDER);
 * app.useGlobalInterceptors(new LoggingInterceptor(logger));
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  /**
   * LoggingInterceptor 생성자
   * @param {Logger} logger - Winston 로거 인스턴스
   */
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 요청/응답을 가로채어 로깅하는 메서드
   * @description 요청 정보를 로깅하고, 응답 완료 시 상태 코드와 응답 시간을 기록
   * @param {ExecutionContext} context - 실행 컨텍스트 (요청/응답 접근용)
   * @param {CallHandler} next - 다음 핸들러 호출을 위한 객체
   * @returns {Observable<unknown>} 응답 데이터 스트림
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logRequest(method, url.split('?')[0], ip, userAgent, {}, {}, {});

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          this.logResponse(method, url.split('?')[0], response.statusCode, startTime, data);
        },
        error: (error: Error) => {
          this.logError(method, url.split('?')[0], response.statusCode, startTime, error);
        },
      }),
    );
  }

  /**
   * 요청 정보를 로깅하는 메서드
   * @private
   * @param {string} method - HTTP 메서드 (GET, POST 등)
   * @param {string} url - 요청 URL
   * @param {string | undefined} ip - 클라이언트 IP 주소
   * @param {string} userAgent - User-Agent 헤더 값
   * @param {Record<string, unknown>} query - 쿼리 파라미터
   * @param {Record<string, unknown>} params - 경로 파라미터
   * @param {Record<string, unknown>} body - 요청 본문
   * @returns {void}
   */
  private logRequest(
    method: string,
    url: string,
    ip: string | undefined,
    userAgent: string,
    query: Record<string, unknown>,
    params: Record<string, unknown>,
    body: Record<string, unknown>,
  ): void {
    this.logger.info(
      `[Request] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
      { context: 'HTTP' },
    );

    if (Object.keys(query).length > 0) {
      this.logger.debug(`Query: ${JSON.stringify(query)}`, { context: 'HTTP' });
    }

    if (Object.keys(params).length > 0) {
      this.logger.debug(`Params: ${JSON.stringify(params)}`, {
        context: 'HTTP',
      });
    }

    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitizeBody(body);
      this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`, {
        context: 'HTTP',
      });
    }
  }

  /**
   * 응답 정보를 로깅하는 메서드
   * @private
   * @param {string} method - HTTP 메서드
   * @param {string} url - 요청 URL
   * @param {number} statusCode - HTTP 상태 코드
   * @param {number} startTime - 요청 시작 시간 (ms)
   * @param {unknown} data - 응답 데이터
   * @returns {void}
   */
  private logResponse(
    method: string,
    url: string,
    statusCode: number,
    startTime: number,
    data: unknown,
  ): void {
    const responseTime = Date.now() - startTime;

    this.logger.info(
      `[Response] ${method} ${url} - Status: ${statusCode} - ${responseTime}ms`,
      { context: 'HTTP' },
    );


  }

  /**
   * 에러 정보를 로깅하는 메서드
   * @private
   * @param {string} method - HTTP 메서드
   * @param {string} url - 요청 URL
   * @param {number} statusCode - HTTP 상태 코드
   * @param {number} startTime - 요청 시작 시간 (ms)
   * @param {Error} error - 발생한 에러 객체
   * @returns {void}
   */
  private logError(
    method: string,
    url: string,
    statusCode: number,
    startTime: number,
    error: Error,
  ): void {
    const responseTime = Date.now() - startTime;

    this.logger.error(
      `[Error] ${method} ${url} - Status: ${statusCode} - ${responseTime}ms`,
      { context: 'HTTP', trace: error.stack },
    );
  }

  /**
   * 요청 본문에서 민감한 정보를 마스킹하는 메서드
   * @private
   * @param {Record<string, unknown>} body - 원본 요청 본문
   * @returns {Record<string, unknown>} 민감 정보가 마스킹된 본문
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sanitizedBody = { ...body };

    if (sanitizedBody.password) {
      sanitizedBody.password = '***REDACTED***';
    }

    return sanitizedBody;
  }
}
