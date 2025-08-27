import React, { useState } from 'react';
import { ImageUpload } from '../components/ImageUpload';
import { useImageUpload } from '../hooks/useImageUpload';
import { type ProcessedImage } from '../services/uploadApi';

export const ImageUploadTestPage: React.FC = () => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    uploadedImages: hookImages,
    isUploading,
    uploadFiles,
    removeImage,
    clearImages,
    error: hookError,
  } = useImageUpload({
    multiple: true,
    maxFiles: 5,
    onSuccess: (images) => {
      setNotification({
        type: 'success',
        message: `${images.length}개의 이미지가 성공적으로 업로드되었습니다`,
      });
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({
        type: 'error',
        message: error,
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const handleComponentUpload = (images: ProcessedImage[]) => {
    setNotification({
      type: 'success',
      message: `컴포넌트 업로드 완료: ${images.length}개 이미지`,
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleComponentError = (error: string) => {
    setNotification({
      type: 'error',
      message: `컴포넌트 에러: ${error}`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await uploadFiles(Array.from(files));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">이미지 업로드 테스트</h1>
        <p className="text-gray-600">
          드래그앤드롭 이미지 업로드 컴포넌트와 훅의 기능을 테스트할 수 있습니다.
        </p>
      </div>

      {/* 알림 */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 컴포넌트 방식 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">ImageUpload 컴포넌트</h2>
          <p className="text-sm text-gray-600">
            재사용 가능한 드래그앤드롭 이미지 업로드 컴포넌트입니다.
          </p>
          
          <ImageUpload
            multiple={true}
            maxFiles={3}
            onUpload={handleComponentUpload}
            onError={handleComponentError}
            className="border rounded-lg p-4"
          />
        </div>

        {/* 훅 방식 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">useImageUpload 훅</h2>
          <p className="text-sm text-gray-600">
            로직을 분리한 커스텀 훅을 사용하는 방식입니다.
          </p>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="flex-1"
              />
              
              {hookImages.length > 0 && (
                <button
                  onClick={clearImages}
                  disabled={isUploading}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                >
                  모두 삭제
                </button>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm text-gray-600">업로드 중...</span>
              </div>
            )}

            {hookError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {hookError}
              </div>
            )}

            {hookImages.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">업로드된 이미지 ({hookImages.length}개)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {hookImages.map((image, index) => (
                    <div key={image.optimized.fileName} className="relative group">
                      <img
                        src={image.thumbnail?.publicUrl || image.optimized.publicUrl}
                        alt={`업로드 이미지 ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      
                      <button
                        onClick={() => removeImage(index)}
                        className="
                          absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 
                          flex items-center justify-center text-xs opacity-0 group-hover:opacity-100
                          transition-opacity hover:bg-red-600
                        "
                      >
                        ×
                      </button>
                      
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {Math.round(image.optimized.size / 1024)}KB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">사용법 안내</h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">지원되는 파일 형식:</h4>
            <p>JPG, PNG, GIF, WebP (최대 10MB)</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">이미지 최적화:</h4>
            <p>업로드된 이미지는 자동으로 WebP 형식으로 변환되고, 최대 1920x1080 해상도로 리사이즈됩니다.</p>
            <p>썸네일 (300x300)도 함께 생성됩니다.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">드래그앤드롭:</h4>
            <p>파일 탐색기에서 이미지를 드래그하여 업로드 영역에 놓으면 자동으로 업로드됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};