/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evently: {
          bg:            '#F8F5F0',
          surface:       '#F2EDE6',
          surface2:      '#EDE8E0',
          primary:       '#3D5C48',
          secondary:     '#5F7D65',
          energy:        '#F43F5E',
          text:          '#111827',
          textSecondary: '#374151',
          muted:         '#6B7280',
          border:        '#E5E0D8',
          success:       '#3D5C48',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dot-pulse': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%':      { opacity: '1', transform: 'scale(1.2)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.7' },
        },
        'carousel-progress': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        float:       'float 6s ease-in-out infinite',
        'fade-up':   'fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dot-pulse': 'dot-pulse 2.8s ease-in-out infinite',
        shimmer:     'shimmer 3s linear infinite',
        'glow-pulse':'glow-pulse 4s ease-in-out infinite',
        'carousel-progress': 'carousel-progress 4s linear forwards',
      },
      boxShadow: {
        soft:        '0 2px 16px rgba(17, 24, 39, 0.04)',
        elevated:    '0 8px 32px rgba(17, 24, 39, 0.07)',
        hover:       '0 16px 48px rgba(17, 24, 39, 0.1)',
        card:        '0 4px 24px rgba(17, 24, 39, 0.05), 0 0 0 1px rgba(229, 224, 216, 0.5)',
        'card-hover':'0 24px 64px rgba(61, 92, 72, 0.12), 0 8px 24px rgba(17, 24, 39, 0.06)',
        glow:        '0 0 60px rgba(61, 92, 72, 0.14)',
        'glow-energy':'0 0 48px rgba(244, 63, 94, 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #3D5C48 0%, #5F7D65 100%)',
        'gradient-cta':   'linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)',
        'dot-grid':       'radial-gradient(circle, rgba(17,24,39,0.05) 1px, transparent 1px)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
