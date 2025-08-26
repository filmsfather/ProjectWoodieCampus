import dotenv from 'dotenv';
import { AuthService } from '../services/authService';
import { DatabaseService } from '../services/databaseService';
import { config } from '../config';

// 환경변수 로드
dotenv.config();

interface AdminSeedData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

// 환경변수에서 관리자 정보 로드
function getAdminSeedData(): AdminSeedData {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@woodiecampus.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!@#',
    fullName: process.env.ADMIN_FULL_NAME || '시스템 관리자',
  };
}

// 초기 관리자 계정 생성
export async function seedAdminAccount(): Promise<void> {
  try {
    console.log('🌱 초기 관리자 계정 시드 작업을 시작합니다...');

    const adminData = getAdminSeedData();

    // 관리자 계정 존재 여부 확인
    try {
      const existingAdmin = await DatabaseService.getUserByUsername(adminData.username);
      if (existingAdmin) {
        console.log('✅ 관리자 계정이 이미 존재합니다:', adminData.username);
        return;
      }
    } catch (error) {
      // 사용자가 없을 때 에러가 발생하는 것이 정상
    }

    try {
      const existingAdminByEmail = await DatabaseService.getUserByEmail(adminData.email);
      if (existingAdminByEmail) {
        console.log('✅ 해당 이메일로 계정이 이미 존재합니다:', adminData.email);
        return;
      }
    } catch (error) {
      // 사용자가 없을 때 에러가 발생하는 것이 정상
    }

    // 관리자 계정 생성
    const newAdmin = await AuthService.register({
      username: adminData.username,
      email: adminData.email,
      password: adminData.password,
      role: 'admin',
      fullName: adminData.fullName,
    });

    console.log('🎉 초기 관리자 계정이 성공적으로 생성되었습니다!');
    console.log(`   사용자명: ${adminData.username}`);
    console.log(`   이메일: ${adminData.email}`);
    console.log(`   이름: ${adminData.fullName}`);
    console.log(`   역할: admin`);
    
    // 보안을 위해 비밀번호는 로그에 출력하지 않음
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  개발 환경입니다. 기본 비밀번호를 사용 중입니다.');
      console.log('   운영 환경에서는 반드시 ADMIN_PASSWORD 환경변수를 설정하세요.');
    }

  } catch (error) {
    console.error('❌ 관리자 계정 시드 작업 중 오류 발생:', error);
    throw error;
  }
}

// CLI에서 직접 실행할 때
if (require.main === module) {
  (async () => {
    try {
      await seedAdminAccount();
      console.log('✨ 시드 작업이 완료되었습니다.');
      process.exit(0);
    } catch (error) {
      console.error('💥 시드 작업 실패:', error);
      process.exit(1);
    }
  })();
}

// 서버 시작 시 자동 실행을 위한 함수
export async function autoSeedAdminIfNeeded(): Promise<void> {
  try {
    // AUTO_SEED_ADMIN 환경변수가 'true'일 때만 자동 시드 실행
    if (process.env.AUTO_SEED_ADMIN === 'true') {
      await seedAdminAccount();
    }
  } catch (error) {
    console.warn('⚠️  자동 관리자 시드 작업 중 오류:', error);
    // 서버 시작을 방해하지 않도록 에러를 던지지 않음
  }
}

// 추가 관리자 계정 생성을 위한 함수
export async function createAdditionalAdmin(adminData: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}): Promise<void> {
  try {
    console.log(`🔧 추가 관리자 계정 생성: ${adminData.username}`);

    // 중복 검사
    try {
      await DatabaseService.getUserByUsername(adminData.username);
      throw new Error(`사용자명 '${adminData.username}'은 이미 사용 중입니다.`);
    } catch (error) {
      // 사용자가 없을 때는 정상
      if (error instanceof Error && !error.message.includes('사용자를 찾을 수 없습니다')) {
        throw error;
      }
    }

    try {
      await DatabaseService.getUserByEmail(adminData.email);
      throw new Error(`이메일 '${adminData.email}'은 이미 사용 중입니다.`);
    } catch (error) {
      // 사용자가 없을 때는 정상
      if (error instanceof Error && !error.message.includes('사용자를 찾을 수 없습니다')) {
        throw error;
      }
    }

    // 관리자 계정 생성
    await AuthService.register({
      username: adminData.username,
      email: adminData.email,
      password: adminData.password,
      role: 'admin',
      fullName: adminData.fullName || `${adminData.username} 관리자`,
    });

    console.log(`✅ 추가 관리자 계정이 생성되었습니다: ${adminData.username}`);
  } catch (error) {
    console.error(`❌ 추가 관리자 계정 생성 실패:`, error);
    throw error;
  }
}

// 시드 상태 확인 함수
export async function checkAdminSeedStatus(): Promise<{
  hasAdmin: boolean;
  adminCount: number;
  admins: Array<{ username: string; email: string; fullName: string; createdAt: string }>;
}> {
  try {
    // 모든 관리자 계정 조회
    const admins = await DatabaseService.getUsersWithFilters({ role: 'admin', is_active: true }, 100, 0);
    
    return {
      hasAdmin: admins.length > 0,
      adminCount: admins.length,
      admins: admins.map(admin => ({
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name || '',
        createdAt: admin.created_at,
      })),
    };
  } catch (error) {
    console.error('관리자 상태 확인 중 오류:', error);
    return {
      hasAdmin: false,
      adminCount: 0,
      admins: [],
    };
  }
}