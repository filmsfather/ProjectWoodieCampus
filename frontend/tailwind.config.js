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
      },
      spacing: {
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
        6: '48px',
        8: '64px',
        10: '80px',
        12: '96px',
        16: '128px',
        20: '160px',
        24: '192px',
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
      }
    },
  },
  plugins: [],
}