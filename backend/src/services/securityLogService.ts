import { DatabaseService } from './databaseService';

export interface SecurityEvent {
  type: string;
  userId: string | null;
  details: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip?: string;
  userAgent?: string;
}

export class SecurityLogService {
  // 보안 이벤트 로깅
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // 콘솔 로그 (개발/디버그용)
      const logLevel = this.getLogLevel(event.severity);
      console[logLevel](`[SECURITY-${event.severity.toUpperCase()}] ${event.type}`, {
        userId: event.userId,
        timestamp: event.timestamp.toISOString(),
        details: event.details,
        ip: event.ip,
        userAgent: event.userAgent
      });

      // 데이터베이스에 로그 저장 (선택사항 - 테이블이 있는 경우)
      await this.saveToDatabase(event);

      // 심각한 보안 이벤트의 경우 추가 처리
      if (event.severity === 'critical' || event.severity === 'high') {
        await this.handleCriticalEvent(event);
      }
    } catch (error) {
      // 로깅 실패 시에도 애플리케이션이 중단되지 않도록
      console.error('보안 로그 저장 실패:', error);
    }
  }

  // 권한 위반 시도 로그
  static async logAuthorizationViolation(userId: string | null, details: {
    action: string;
    resource: string;
    reason: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'AUTHORIZATION_VIOLATION',
      userId,
      details,
      timestamp: new Date(),
      severity: 'high',
      ip: details.ip,
      userAgent: details.userAgent
    });
  }

  // 인증 실패 로그
  static async logAuthenticationFailure(userId: string | null, details: {
    reason: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'AUTHENTICATION_FAILURE',
      userId,
      details,
      timestamp: new Date(),
      severity: 'medium',
      ip: details.ip,
      userAgent: details.userAgent
    });
  }

  // 의심스러운 활동 로그
  static async logSuspiciousActivity(userId: string | null, details: {
    activity: string;
    reason: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      details,
      timestamp: new Date(),
      severity: 'medium',
      ip: details.ip,
      userAgent: details.userAgent
    });
  }

  // Rate limiting 위반 로그
  static async logRateLimitViolation(userId: string | null, details: {
    endpoint: string;
    count: number;
    limit: number;
    ip?: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'RATE_LIMIT_VIOLATION',
      userId,
      details,
      timestamp: new Date(),
      severity: 'medium',
      ip: details.ip
    });
  }

  // 데이터 무결성 위반 로그
  static async logDataIntegrityViolation(userId: string | null, details: {
    table: string;
    operation: string;
    reason: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'DATA_INTEGRITY_VIOLATION',
      userId,
      details,
      timestamp: new Date(),
      severity: 'high'
    });
  }

  // 성공적인 중요 작업 로그
  static async logSuccessfulOperation(userId: string, details: {
    operation: string;
    resource: string;
    [key: string]: any;
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUCCESSFUL_OPERATION',
      userId,
      details,
      timestamp: new Date(),
      severity: 'low'
    });
  }

  private static getLogLevel(severity: SecurityEvent['severity']): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'log';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'log';
    }
  }

  private static async saveToDatabase(event: SecurityEvent): Promise<void> {
    try {
      // 보안 로그 테이블이 있다면 저장
      // 현재는 파일 시스템이나 외부 로깅 서비스 사용 권장
      
      // 예시: JSON 파일로 로그 저장
      const logEntry = {
        ...event,
        timestamp: event.timestamp.toISOString()
      };
      
      // 실제 구현에서는 winston 같은 로깅 라이브러리나 
      // ELK Stack, Datadog 등 외부 서비스 사용 권장
      
    } catch (error) {
      console.error('데이터베이스 로그 저장 실패:', error);
    }
  }

  private static async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    try {
      // 심각한 보안 이벤트 처리
      console.error(`🚨 CRITICAL SECURITY EVENT: ${event.type}`, {
        userId: event.userId,
        details: event.details,
        timestamp: event.timestamp.toISOString()
      });

      // 실제 프로덕션에서는:
      // 1. 관리자에게 알림 전송 (이메일, Slack, SMS 등)
      // 2. 자동 차단 조치 (계정 잠금, IP 차단 등)
      // 3. 외부 보안 모니터링 시스템에 알림
      // 4. 로그 백업 및 포렌식 대비

      // 예시: 연속된 권한 위반 시도 감지
      if (event.type === 'AUTHORIZATION_VIOLATION' && event.userId) {
        await this.checkForRepeatedViolations(event.userId);
      }
    } catch (error) {
      console.error('심각한 보안 이벤트 처리 실패:', error);
    }
  }

  private static async checkForRepeatedViolations(userId: string): Promise<void> {
    // 실제 구현에서는 시간 윈도우 내 위반 횟수를 체크하여
    // 임계값을 초과하면 계정을 일시적으로 잠그거나 추가 보안 조치 실행
    console.warn(`사용자 ${userId}의 반복적인 권한 위반 감지됨`);
  }

  // 보안 통계 조회 (관리자용)
  static async getSecurityStats(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topViolators: Array<{ userId: string; count: number }>;
  }> {
    // 실제 구현에서는 데이터베이스에서 통계 조회
    // 현재는 더미 데이터 반환
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      topViolators: []
    };
  }
}