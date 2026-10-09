import * as winston from 'winston';

/**
 * 데코레이터 전용 Winston Logger 인스턴스
 * @description DI 컨테이너 외부에서 사용되므로 별도 인스턴스 생성
 * @note 앱의 메인 Logger와 동일한 포맷 유지 권장
 */
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({
            timestamp,
            level,
            message,
          }: {
            timestamp: string;
            level: string;
            message: string;
          }) => {
            return `[${timestamp}] [${level.toUpperCase()}] [ExecutionTime] ${message}`;
          },
        ),
      ),
    }),
  ],
});

/**
 * 메서드 실행 시간을 측정하고 로깅하는 데코레이터
 * @description
 * - 메서드 시작 시점 로깅
 * - 메서드 종료 시점과 실행 시간 로깅
 * - 에러 발생 시 에러 메시지와 실행 시간 로깅
 *
 * @example
 * class UserService {
 *   @LogExecutionTime()
 *   async findAll(): Promise<User[]> {
 *     // 이 메서드의 실행 시간이 자동으로 로깅됨
 *     return this.userRepository.find();
 *   }
 * }
 *
 * @returns {MethodDecorator} 메서드 데코레이터
 */
export function LogExecutionTime(): MethodDecorator {
  return function <T>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const startTime = Date.now();
      const className = target.constructor.name;
      const methodName = String(propertyKey);

      logger.info(`[Start] ${className}.${methodName}()`);

      try {
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        logger.info(
          `[End] ${className}.${methodName}() - Execution time: ${executionTime}ms`,
        );

        return result;
      } catch (error: unknown) {
        const executionTime = Date.now() - startTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        logger.error(
          `[Error] ${className}.${methodName}() - Execution time: ${executionTime}ms - ${errorMessage}`,
        );

        throw error;
      }
    } as T;

    return descriptor;
  };
}
