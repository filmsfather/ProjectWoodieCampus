import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 연결 테스트 함수
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users') // 테이블이 없어도 연결은 확인 가능
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // 테이블 없음 에러는 무시
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};