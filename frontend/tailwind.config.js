/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 기존 design-system.css의 토큰들을 Tailwind로 변환
      colors: {
        primary: {
          DEFAULT: '#5A6450',
          dark: '#4a5440',
          light: '#6a7460',
        },
        secondary: {
          DEFAULT: '#6E7864',
          dark: '#5e6854',
          light: '#7e8874',
        },
        // 역할별 테마 색상
        student: {
          DEFAULT: '#5A6450',
          dark: '#4a5440',
          light: '#6a7460',
        },
        teacher: {
          DEFAULT: '#6E7864',
          dark: '#5e6854',
          light: '#7e8874',
        },
        admin: {
          DEFAULT: '#AA4632',
          dark: '#9a3e2a',
          light: '#ba563a',
        },
        neutral: {
          50: '#F5F5F0',
          100: '#E1E1DC',
          200: '#CDCDC8',
          300: '#B9B9B4',
          400: '#A5A5A0',
          500: '#91918C',
          600: '#7D7D78',
          700: '#696964',
          800: '#555550',
          900: '#41413C',
        },
        accent: {
          DEFAULT: '#AA4632',
          dark: '#9a3e2a',
          light: '#ba563a',
        },
        success: '#28a745',
        warning: '#ffc107',
        error: '#AA4632',
        info: '#17a2b8',
      },
      fontFamily: {
        primary: ['Noto Sans KR', 'system-ui', 'sans-serif'],
        secondary: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        // 고정 크기 (기존 호환성)
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '32px',
        '5xl': '36px',
        '6xl': '48px',
        
        // 유동형 타이포그래피 (CSS clamp 기반)
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', // 12px~14px
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)', // 14px~16px
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)', // 16px~18px
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)', // 18px~20px
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)', // 20px~24px
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)', // 24px~30px
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)', // 30px~36px
        'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 2.75rem)', // 36px~44px
        'fluid-5xl': 'clamp(2.75rem, 2.3rem + 2.25vw, 3.5rem)', // 44px~56px
        'fluid-6xl': 'clamp(3.5rem, 2.8rem + 3.5vw, 4.5rem)', // 56px~72px
      },
      spacing: {
        // 8pt 기반 스페이싱 시스템
        0: '0px',
        0.5: '4px',   // 0.5 단위 (하프 스텝)
        1: '8px',     // 기본 단위
        1.5: '12px',  // 1.5 단위 (텍스트-아이콘 간격용)
        2: '16px',    // 2 단위
        2.5: '20px',  // 2.5 단위
        3: '24px',    // 3 단위
        3.5: '28px',  // 3.5 단위
        4: '32px',    // 4 단위
        5: '40px',    // 5 단위
        6: '48px',    // 6 단위
        7: '56px',    // 7 단위
        8: '64px',    // 8 단위
        9: '72px',    // 9 단위
        10: '80px',   // 10 단위
        11: '88px',   // 11 단위
        12: '96px',   // 12 단위
        14: '112px',  // 14 단위
        16: '128px',  // 16 단위
        18: '144px',  // 18 단위
        20: '160px',  // 20 단위
        22: '176px',  // 22 단위
        24: '192px',  // 24 단위
        28: '224px',  // 28 단위
        32: '256px',  // 32 단위
        36: '288px',  // 36 단위
        40: '320px',  // 40 단위
        44: '352px',  // 44 단위
        48: '384px',  // 48 단위
        
        // 컴포넌트별 특수 간격
        'card-padding': '16px',      // 카드 기본 패딩
        'card-header': '12px',       // 카드 헤더 간격
        'card-content': '16px',      // 카드 콘텐츠 간격
        'card-footer': '12px',       // 카드 푸터 간격
        'section-gap': '32px',       // 섹션 간격
        'element-gap': '24px',       // 엘리먼트 간격
        'text-icon-gap': '12px',     // 텍스트-아이콘 간격
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      maxWidth: {
        container: '1200px',
      },
      height: {
        button: '44px',
        input: '44px',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        'modal-backdrop': '1040',
        modal: '1050',
        popover: '1060',
        tooltip: '1070',
        toast: '1080',
      },
      // 텍스트 길이 제한 및 ellipsis 처리
      lineClamp: {
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        6: '6',
      },
      // 최대 너비 (읽기 최적화)
      maxWidth: {
        'container': '1200px',
        'reading': '65ch',    // 읽기 최적 너비 (65자)
        'button': '200px',    // 버튼 최대 너비
        'card-title': '300px', // 카드 제목 최대 너비
      },
    },
  },
  plugins: [
    // 텍스트 ellipsis 플러그인 (line-clamp 지원)
    require('@tailwindcss/line-clamp'),
  ],
}