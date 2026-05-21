/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#F8FAFC',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          elevated: '#F1F5F9',
          border: '#CBD5E1',
        },
        accent: {
          DEFAULT: '#8B1A2F',
          light: '#A52035',
          dim: 'rgba(139,26,47,0.08)',
        },
        success: {
          DEFAULT: '#16A34A',
          dim: 'rgba(22,163,74,0.1)',
        },
        warning: {
          DEFAULT: '#D97706',
          dim: 'rgba(217,119,6,0.1)',
        },
        danger: {
          DEFAULT: '#DC2626',
          dim: 'rgba(220,38,38,0.1)',
        },
        ink: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B',
          faint: '#94A3B8',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
