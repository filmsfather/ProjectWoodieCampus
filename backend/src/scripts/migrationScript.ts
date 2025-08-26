import { supabase } from '../services/databaseService';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🚀 Starting Supabase migration...');
  
  try {
    // 1. 스키마 파일 읽기
    const schemaPath = path.join(__dirname, '../../../database/supabase-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Applying database schema...');
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (schemaError) {
      console.error('❌ Schema migration failed:', schemaError);
      return;
    }
    
    console.log('✅ Schema applied successfully!');
    
    // 2. 샘플 데이터 파일 읽기
    const dataPath = path.join(__dirname, '../../../database/sample-data.sql');
    const dataSQL = fs.readFileSync(dataPath, 'utf8');
    
    console.log('📥 Inserting sample data...');
    const { error: dataError } = await supabase.rpc('exec_sql', { sql: dataSQL });
    
    if (dataError) {
      console.error('❌ Sample data insertion failed:', dataError);
      return;
    }
    
    console.log('✅ Sample data inserted successfully!');
    console.log('🎉 Migration completed!');
    
    // 3. 데이터 확인
    console.log('📊 Verifying data...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Data verification failed:', usersError);
    } else {
      console.log('👥 Users created:', users);
    }
    
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('title, subject')
      .limit(3);
    
    if (problemsError) {
      console.error('❌ Problems verification failed:', problemsError);
    } else {
      console.log('📚 Problems created:', problems);
    }
    
  } catch (error) {
    console.error('💥 Migration failed with error:', error);
  }
}

// RPC 함수가 없다면 개별적으로 실행
async function runMigrationAlternative() {
  console.log('🚀 Starting alternative migration...');
  
  try {
    // 사용자 데이터 직접 삽입 테스트
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single();
    
    if (existingUser) {
      console.log('✅ Users table already exists and has data');
    } else {
      console.log('❌ Users table not found or empty');
      console.log('⚠️  Please run the SQL scripts manually in Supabase dashboard');
    }
    
    // 테이블 구조 확인
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table access error:', error.message);
      console.log('📝 You need to run the schema migration first');
    } else {
      console.log('✅ Database connection working');
    }
    
  } catch (error) {
    console.error('💥 Alternative migration failed:', error);
  }
}

// 실행
if (require.main === module) {
  runMigrationAlternative()
    .then(() => {
      console.log('🏁 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigration, runMigrationAlternative };