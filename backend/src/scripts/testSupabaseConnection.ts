import { supabase } from '../services/databaseService';

async function testSupabaseConnection() {
  console.log('🚀 Testing Supabase connection...');
  
  try {
    // 1. 사용자 데이터 확인
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, role, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table connected:', users?.length, 'users found');
      console.log('👥 Sample users:', users);
    }

    // 2. 문제 데이터 확인
    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('title, subject, difficulty')
      .limit(3);

    if (problemsError) {
      console.error('❌ Problems table error:', problemsError.message);
    } else {
      console.log('✅ Problems table connected:', problems?.length, 'problems found');
      console.log('📚 Sample problems:', problems);
    }

    // 3. 로그인 테스트
    const { data: adminUser } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (adminUser) {
      console.log('✅ Admin user found:', adminUser.username, '-', adminUser.role);
    }

    console.log('🎉 Database connection test completed!');

  } catch (error) {
    console.error('💥 Connection test failed:', error);
  }
}

// 실행
if (require.main === module) {
  testSupabaseConnection()
    .then(() => {
      console.log('🏁 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testSupabaseConnection };