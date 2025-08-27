import { supabase } from '../config/supabase';

export async function setupStorageBucket() {
  try {
    // 버킷 존재 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('버킷 목록 조회 실패:', listError);
      return false;
    }

    const bucketName = 'woodie-campus';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // 버킷 생성
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // 공개 액세스 허용
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error('버킷 생성 실패:', error);
        return false;
      }

      console.log(`Storage 버킷 '${bucketName}'이 성공적으로 생성되었습니다.`);
    } else {
      console.log(`Storage 버킷 '${bucketName}'이 이미 존재합니다.`);
    }

    return true;
  } catch (error) {
    console.error('Storage 설정 중 오류 발생:', error);
    return false;
  }
}

// 직접 실행 시 버킷 설정
if (require.main === module) {
  setupStorageBucket()
    .then(success => {
      if (success) {
        console.log('Storage 설정 완료!');
        process.exit(0);
      } else {
        console.error('Storage 설정 실패!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Storage 설정 중 치명적 오류:', error);
      process.exit(1);
    });
}