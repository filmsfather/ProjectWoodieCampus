#!/usr/bin/env ts-node
import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function migrateReviewSystem() {
  console.log('🚀 복습 시스템 데이터베이스 마이그레이션을 시작합니다...');
  
  try {
    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, '../../../database/review-system-enhancement.sql');
    const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL 명령어들을 세미콜론으로 분리하여 실행
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 총 ${statements.length}개의 SQL 명령어를 실행합니다...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`📋 명령어 ${i + 1}/${statements.length} 실행 중...`);
      
      // 각 명령어 실행
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });
      
      if (error) {
        // 이미 존재하는 객체에 대한 에러는 무시
        if (error.message?.includes('already exists') || 
            error.message?.includes('does not exist')) {
          console.log(`⚠️  경고: ${error.message} (무시됨)`);
          continue;
        }
        throw error;
      }
      
      console.log(`✅ 명령어 ${i + 1} 완료`);
    }
    
    // 마이그레이션 완료 후 데이터 검증
    console.log('🔍 마이그레이션 결과 검증 중...');
    
    // review_history 테이블 존재 확인
    const { data: reviewHistoryCheck, error: reviewHistoryError } = await supabase
      .from('review_history')
      .select('count')
      .limit(1);
    
    if (reviewHistoryError) {
      console.log('⚠️  review_history 테이블 확인 실패:', reviewHistoryError.message);
    } else {
      console.log('✅ review_history 테이블 생성 확인됨');
    }
    
    // daily_review_stats 테이블 존재 확인  
    const { data: dailyStatsCheck, error: dailyStatsError } = await supabase
      .from('daily_review_stats')
      .select('count')
      .limit(1);
    
    if (dailyStatsError) {
      console.log('⚠️  daily_review_stats 테이블 확인 실패:', dailyStatsError.message);
    } else {
      console.log('✅ daily_review_stats 테이블 생성 확인됨');
    }
    
    // 뷰 존재 확인
    const { data: viewCheck, error: viewError } = await supabase
      .rpc('check_view_exists', { view_name: 'review_priority_view' });
    
    if (!viewError) {
      console.log('✅ review_priority_view 뷰 생성 확인됨');
    }
    
    console.log('🎉 복습 시스템 데이터베이스 마이그레이션이 완료되었습니다!');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 직접 실행 시
if (require.main === module) {
  migrateReviewSystem()
    .then(() => {
      console.log('✅ 마이그레이션 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 마이그레이션 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { migrateReviewSystem };