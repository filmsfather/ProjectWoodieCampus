import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DatabaseService } from '../services/databaseService';
import { SecurityLogService } from '../services/securityLogService';

// 교사 역할 확인 미들웨어
export const requireTeacher = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { user } = req;
  
  if (!user || !user.userId) {
    SecurityLogService.logAuthenticationFailure(null, {
      reason: 'Missing authentication',
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  if (user.role !== 'teacher' && user.role !== 'admin') {
    SecurityLogService.logAuthorizationViolation(user.userId, {
      action: 'access_teacher_resource',
      resource: req.path,
      reason: `Insufficient permissions: ${user.role} role attempted to access teacher resource`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      success: false,
      message: '교사 권한이 필요합니다.',
    });
  }

  next();
};

// 관리자 역할 확인 미들웨어
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const { user } = req;
  
  if (!user || !user.userId) {
    SecurityLogService.logAuthenticationFailure(null, {
      reason: 'Missing authentication',
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.',
    });
  }

  if (user.role !== 'admin') {
    SecurityLogService.logAuthorizationViolation(user.userId, {
      action: 'access_admin_resource',
      resource: req.path,
      reason: `Insufficient permissions: ${user.role} role attempted to access admin resource`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
    });
  }

  next();
};

// 문제집 소유권 검증 미들웨어
export const validateWorkbookOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const { id: workbookId } = req.params;

    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    if (!workbookId) {
      return res.status(400).json({
        success: false,
        message: '문제집 ID가 필요합니다.',
      });
    }

    // 관리자는 모든 문제집에 접근 가능
    if (user.role === 'admin') {
      return next();
    }

    // 문제집 소유권 확인
    const workbook = await DatabaseService.getWorkbook(workbookId);
    
    if (!workbook) {
      SecurityLogService.logSuspiciousActivity(user.userId, {
        activity: 'access_nonexistent_workbook',
        reason: 'Attempted to access workbook that does not exist',
        workbookId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(404).json({
        success: false,
        message: '문제집을 찾을 수 없습니다.',
      });
    }

    if (user.role === 'teacher' && workbook.created_by !== user.userId) {
      SecurityLogService.logAuthorizationViolation(user.userId, {
        action: 'access_others_workbook',
        resource: `workbook:${workbookId}`,
        reason: `Teacher attempted to access workbook owned by ${workbook.created_by}`,
        workbookId,
        ownerId: workbook.created_by,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        success: false,
        message: '본인이 작성한 문제집만 수정할 수 있습니다.',
      });
    }

    // req 객체에 workbook 정보 추가 (중복 조회 방지)
    (req as any).workbook = workbook;
    next();
  } catch (error) {
    console.error('문제집 소유권 검증 실패:', error);
    res.status(500).json({
      success: false,
      message: '권한 검증 중 오류가 발생했습니다.',
    });
  }
};

// 배포 대상 권한 검증 미들웨어
export const validateAssignmentTargets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { user } = req;
    const { targetType, targetIds } = req.body;

    if (!user || !user.userId) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.',
      });
    }

    if (!targetType || !Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '배포 대상을 올바르게 선택해주세요.',
      });
    }

    if (!['individual', 'group', 'class'].includes(targetType)) {
      SecurityLogService.logSuspiciousActivity(user.userId, {
        activity: 'invalid_target_type',
        reason: 'Used invalid target type for workbook assignment',
        targetType,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 배포 대상 타입입니다.',
      });
    }

    // 관리자는 모든 대상에 배포 가능
    if (user.role === 'admin') {
      return next();
    }

    let validationResult: { success: boolean; invalidIds?: string[] };

    switch (targetType) {
      case 'individual':
        // 개별 학생: 교사가 담당하는 반의 학생들만 가능
        const teacherStudents = await DatabaseService.getStudentsByTeacher(user.userId);
        const teacherStudentIds = teacherStudents.map(s => s.id);
        const invalidStudentIds = targetIds.filter(id => !teacherStudentIds.includes(id));
        
        validationResult = {
          success: invalidStudentIds.length === 0,
          invalidIds: invalidStudentIds
        };
        
        if (!validationResult.success) {
          SecurityLogService.logAuthorizationViolation(user.userId, {
            action: 'assign_to_unauthorized_students',
            resource: 'student_assignment',
            reason: 'Teacher attempted to assign workbook to students not in their classes',
            requestedStudentIds: targetIds,
            invalidStudentIds,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
        break;

      case 'class':
        // 반: 교사가 담당하는 반만 가능
        const validClasses = await DatabaseService.validateTeacherClasses(user.userId, targetIds);
        const invalidClassIds = targetIds.filter(id => !validClasses.includes(id));
        
        validationResult = {
          success: invalidClassIds.length === 0,
          invalidIds: invalidClassIds
        };
        
        if (!validationResult.success) {
          SecurityLogService.logAuthorizationViolation(user.userId, {
            action: 'assign_to_unauthorized_classes',
            resource: 'class_assignment',
            reason: 'Teacher attempted to assign workbook to classes they do not teach',
            requestedClassIds: targetIds,
            invalidClassIds,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
        break;

      case 'group':
        // 그룹: 교사가 생성한 그룹만 가능
        const validGroups = await DatabaseService.validateStudentGroups(user.userId, targetIds);
        const invalidGroupIds = targetIds.filter(id => !validGroups.includes(id));
        
        validationResult = {
          success: invalidGroupIds.length === 0,
          invalidIds: invalidGroupIds
        };
        
        if (!validationResult.success) {
          SecurityLogService.logAuthorizationViolation(user.userId, {
            action: 'assign_to_unauthorized_groups',
            resource: 'group_assignment',
            reason: 'Teacher attempted to assign workbook to groups they do not own',
            requestedGroupIds: targetIds,
            invalidGroupIds,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '지원하지 않는 배포 대상 타입입니다.',
        });
    }

    if (!validationResult.success) {
      return res.status(403).json({
        success: false,
        message: `권한이 없는 ${targetType === 'individual' ? '학생' : targetType === 'class' ? '반' : '그룹'}이 포함되어 있습니다.`,
        invalidIds: validationResult.invalidIds
      });
    }

    next();
  } catch (error) {
    console.error('배포 대상 권한 검증 실패:', error);
    
    await SecurityLogService.logSecurityEvent({
      type: 'VALIDATION_ERROR',
      userId: req.user?.userId || null,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        targetType: req.body.targetType,
        endpoint: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      timestamp: new Date(),
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(500).json({
      success: false,
      message: '권한 검증 중 오류가 발생했습니다.',
    });
  }
};

// Rate limiting을 위한 간단한 메모리 기반 카운터
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting 미들웨어
export const rateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const key = `${req.user?.userId || req.ip}_${req.path}`;
    const now = Date.now();
    
    const userLimit = rateLimitStore.get(key);
    
    if (!userLimit || now > userLimit.resetTime) {
      // 새로운 윈도우 시작
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      SecurityLogService.logRateLimitViolation(req.user?.userId || null, {
        endpoint: req.path,
        count: userLimit.count,
        limit: maxRequests,
        ip: req.ip
      });
      
      return res.status(429).json({
        success: false,
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      });
    }
    
    userLimit.count++;
    next();
  };
};

// Input validation 미들웨어
export const validateWorkbookAssignmentInput = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { targetType, targetIds, scheduledFor, dueDate, maxAttempts } = req.body;

  // 필수 필드 검증
  if (!targetType || !targetIds) {
    return res.status(400).json({
      success: false,
      message: '배포 대상을 선택해주세요.',
    });
  }

  // targetIds 배열 검증
  if (!Array.isArray(targetIds)) {
    return res.status(400).json({
      success: false,
      message: '배포 대상 ID는 배열 형태여야 합니다.',
    });
  }

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const invalidIds = targetIds.filter(id => typeof id !== 'string' || !uuidRegex.test(id));
  
  if (invalidIds.length > 0) {
    await SecurityLogService.logSuspiciousActivity(req.user?.userId || null, {
      activity: 'invalid_uuid_format',
      reason: 'Submitted invalid UUID format in target IDs',
      invalidIds,
      endpoint: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(400).json({
      success: false,
      message: '유효하지 않은 ID 형식입니다.',
    });
  }

  // 날짜 형식 검증
  if (scheduledFor) {
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 배포 시작일입니다.',
      });
    }
  }

  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    if (isNaN(dueDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 마감일입니다.',
      });
    }

    // 마감일이 배포일보다 이전인지 확인
    if (scheduledFor && dueDateObj <= new Date(scheduledFor)) {
      return res.status(400).json({
        success: false,
        message: '마감일은 배포 시작일보다 이후여야 합니다.',
      });
    }
  }

  // maxAttempts 검증
  if (maxAttempts !== undefined) {
    if (typeof maxAttempts !== 'number' || maxAttempts < 1 || maxAttempts > 999) {
      return res.status(400).json({
        success: false,
        message: '최대 시도 횟수는 1-999 사이의 숫자여야 합니다.',
      });
    }
  }

  next();
};