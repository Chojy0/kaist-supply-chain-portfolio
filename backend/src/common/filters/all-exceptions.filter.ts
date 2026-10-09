import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ErrorResponse } from '../exceptions/base.exception';

/**
 * 전역 예외 필터
 * @description 애플리케이션에서 발생하는 모든 예외를 포착하여 표준화된 에러 응답으로 변환
 * @implements {ExceptionFilter}
 *
 * @example
 * // main.ts에서 전역 필터로 등록
 * const logger = app.get(WINSTON_MODULE_PROVIDER);
 * app.useGlobalFilters(new AllExceptionsFilter(logger));
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * AllExceptionsFilter 생성자
   * @param {Logger} logger - Winston 로거 인스턴스
   */
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 예외를 포착하여 처리하는 메서드
   * @description HTTP 예외, 일반 에러, 알 수 없는 예외를 각각 구분하여 처리
   * @param {unknown} exception - 발생한 예외 객체
   * @param {ArgumentsHost} host - 실행 컨텍스트 정보를 담은 호스트 객체
   * @returns {void}
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorResponse } = this.buildErrorResponse(
      exception,
      request,
    );

    this.logError(request, status, errorResponse, exception);

    response.status(status).json(errorResponse);
  }

  /**
   * 예외 타입에 따라 에러 응답을 생성하는 메서드
   * @private
   * @param {unknown} exception - 발생한 예외 객체
   * @param {Request} request - HTTP 요청 객체
   * @returns {{ status: HttpStatus; errorResponse: ErrorResponse }} 상태 코드와 에러 응답 객체
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): { status: HttpStatus; errorResponse: ErrorResponse } {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, request);
    }

    if (exception instanceof Error) {
      return this.handleError(exception, request);
    }

    return this.handleUnknownException(request);
  }

  /**
   * HTTP 예외를 처리하는 메서드
   * @private
   * @param {HttpException} exception - HTTP 예외 객체
   * @param {Request} request - HTTP 요청 객체
   * @returns {{ status: HttpStatus; errorResponse: ErrorResponse }} 상태 코드와 에러 응답 객체
   */
  private handleHttpException(
    exception: HttpException,
    request: Request,
  ): { status: HttpStatus; errorResponse: ErrorResponse } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorResponse: ErrorResponse;

    if (this.isErrorResponseObject(exceptionResponse)) {
      errorResponse = {
        statusCode: exceptionResponse.statusCode ?? status,
        message: exceptionResponse.message ?? 'An error occurred',
        error: exceptionResponse.error ?? HttpStatus[status],
        timestamp: exceptionResponse.timestamp ?? new Date().toISOString(),
        path: request.url,
        details: exceptionResponse.details,
      };
    } else {
      errorResponse = {
        statusCode: status,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : 'An error occurred',
        error: HttpStatus[status],
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    return { status, errorResponse };
  }

  /**
   * 일반 Error 객체를 처리하는 메서드
   * @private
   * @param {Error} exception - Error 객체
   * @param {Request} request - HTTP 요청 객체
   * @returns {{ status: HttpStatus; errorResponse: ErrorResponse }} 상태 코드와 에러 응답 객체
   */
  private handleError(
    exception: Error,
    request: Request,
  ): { status: HttpStatus; errorResponse: ErrorResponse } {
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      details:
        process.env.NODE_ENV === 'development'
          ? { stack: exception.stack }
          : undefined,
    };

    return { status, errorResponse };
  }

  /**
   * 알 수 없는 예외를 처리하는 메서드
   * @private
   * @param {Request} request - HTTP 요청 객체
   * @returns {{ status: HttpStatus; errorResponse: ErrorResponse }} 상태 코드와 에러 응답 객체
   */
  private handleUnknownException(request: Request): {
    status: HttpStatus;
    errorResponse: ErrorResponse;
  } {
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    return { status, errorResponse };
  }

  /**
   * 에러 정보를 로깅하는 메서드
   * @private
   * @param {Request} request - HTTP 요청 객체
   * @param {HttpStatus} status - HTTP 상태 코드
   * @param {ErrorResponse} errorResponse - 에러 응답 객체
   * @param {unknown} exception - 원본 예외 객체
   * @returns {void}
   */
  private logError(
    request: Request,
    status: HttpStatus,
    errorResponse: ErrorResponse,
    exception: unknown,
  ): void {
    this.logger.error(
      `${request.method} ${request.url.split('?')[0]} - Status: ${status} - ${errorResponse.message}`,
      {
        context: 'AllExceptionsFilter',
        trace:
          exception instanceof Error
            ? exception.stack
            : JSON.stringify(exception),



      },
    );
  }

  /**
   * 객체가 ErrorResponse 형태인지 확인하는 타입 가드
   * @private
   * @param {unknown} response - 검사할 객체
   * @returns {response is Partial<ErrorResponse>} ErrorResponse 형태 여부
   */
  private isErrorResponseObject(
    response: unknown,
  ): response is Partial<ErrorResponse> {
    return typeof response === 'object' && response !== null;
  }
}
