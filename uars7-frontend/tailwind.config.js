/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B263B',
        secondary: '#415A77', 
        accent: '#FF7F50',
        bg: '#F4F6F8',
        paper: '#FFFFFF'
      },
      borderRadius: {
        '10': '10px',
        '12': '12px'
      },
      boxShadow: {
        'pvii': '0 4px 16px rgba(27,38,59,.12)'
      },
      animation: {
        'marquee-y': 'marqueeY 12s linear infinite',
        'pulse-opacity': 'pulseOpacity 1.2s linear infinite'
      },
      keyframes: {
        marqueeY: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' }
        },
        pulseOpacity: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  safelist: [
    'bg-primary',
    'bg-secondary',
    'bg-accent', 
    'bg-bg',
    'bg-paper',
    'text-primary',
    'text-secondary',
    'text-accent',
    'border-primary',
    'border-secondary', 
    'border-accent',
    'shadow-pvii',
    'rounded-10',
    'rounded-12',
    'glassmorphism',
    'kpi-card'
  ]
}
