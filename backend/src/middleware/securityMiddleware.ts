import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request, Response, NextFunction } from 'express';

export class SecurityMiddleware {
  // 일반적인 API 요청 제한
  static apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 15분당 최대 100개 요청
    message: {
      success: false,
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 로그인 요청 제한 (브루트포스 공격 방지)
  static loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 15분당 최대 5회 로그인 시도
    message: {
      success: false,
      message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
  });

  // 회원가입 요청 제한
  static registerRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 3, // 1시간당 최대 3회 회원가입 시도
    message: {
      success: false,
      message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도하세요.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 비밀번호 변경 요청 제한
  static passwordChangeRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1시간
    max: 5, // 1시간당 최대 5회 비밀번호 변경
    message: {
      success: false,
      message: '비밀번호 변경 시도가 너무 많습니다. 1시간 후 다시 시도하세요.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 토큰 갱신 요청 제한
  static refreshTokenRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 10, // 15분당 최대 10회 토큰 갱신
    message: {
      success: false,
      message: '토큰 갱신 요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // 느린 응답으로 공격 지연시키기
  static slowDownAttacks = slowDown({
    windowMs: 15 * 60 * 1000, // 15분
    delayAfter: 50, // 15분당 50개 요청 후부터 지연 시작
    delayMs: (used, req) => (used - 50) * 500, // 요청마다 0.5초씩 지연 증가
    maxDelayMs: 20000, // 최대 20초 지연
  });

  // SQL Injection 및 XSS 방지를 위한 입력 검증
  static validateInput(req: Request, res: Response, next: NextFunction) {
    const suspiciousPatterns = [
      /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi, // XSS
      /(javascript:)/gi, // XSS
      /(on\w+\s*=)/gi, // XSS event handlers
      /('|\"|;|--|\*|\/\*|\*\/|xp_|sp_)/gi, // SQL Injection patterns
      /(union\s+select)/gi, // SQL Injection
      /(drop\s+table)/gi, // SQL Injection
      /(insert\s+into)/gi, // SQL Injection
      /(delete\s+from)/gi, // SQL Injection
    ];

    const checkObject = (obj: any): boolean => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(obj[key])) {
              return true;
            }
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
      return false;
    };

    // Request body, query, params 검증
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 입력입니다.',
      });
    }

    next();
  }

  // IP 화이트리스트 검증 (관리자 기능용)
  static ipWhitelist(allowedIPs: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.socket.remoteAddress || '';
      const isAllowed = allowedIPs.some(ip => {
        if (ip.includes('/')) {
          // CIDR notation 지원 (간단한 구현)
          const [network, prefixLength] = ip.split('/');
          // 실제 운영환경에서는 더 정교한 CIDR 검증 필요
          return clientIP.startsWith(network.split('.').slice(0, 2).join('.'));
        }
        return clientIP === ip;
      });

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: '접근이 허용되지 않은 IP입니다.',
        });
      }

      next();
    };
  }

  // 요청 크기 제한
  static requestSizeLimit(maxSize: string = '10mb') {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = req.get('Content-Length');
      if (contentLength) {
        const sizeInMB = parseInt(contentLength) / (1024 * 1024);
        const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
        
        if (sizeInMB > maxSizeInMB) {
          return res.status(413).json({
            success: false,
            message: `요청 크기가 너무 큽니다. 최대 ${maxSize} 까지 허용됩니다.`,
          });
        }
      }
      next();
    };
  }

  // 헤더 검증 및 보안 강화
  static securityHeaders(req: Request, res: Response, next: NextFunction) {
    // 보안 헤더 추가
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // 개발/디버깅 정보 숨기기
    res.removeHeader('X-Powered-By');
    
    next();
  }

  // 사용자 에이전트 검증 (봇 차단)
  static validateUserAgent(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.get('User-Agent');
    
    if (!userAgent) {
      return res.status(400).json({
        success: false,
        message: 'User-Agent 헤더가 필요합니다.',
      });
    }

    // 의심스러운 User-Agent 패턴
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      console.warn(`Suspicious User-Agent blocked: ${userAgent} from IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: '접근이 차단되었습니다.',
      });
    }

    next();
  }
}