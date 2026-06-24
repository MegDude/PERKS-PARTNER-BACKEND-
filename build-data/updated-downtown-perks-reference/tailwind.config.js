/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			sm: '10px',
  			md: '14px',
  			lg: '18px',
  			xl: '24px',
  			'2xl': '32px',
  		},
  		colors: {
  			navy: '#0B1F33',
  			navySoft: '#1A3151',
  			navyHover: '#2A4366',
  			gold: '#C9A227',
  			goldSoft: '#E8C97A',
  			goldDeep: '#B8963E',
  			bgMain: '#FAFBFC',
  			bgCard: '#FFFFFF',
  			bgAlt: '#F4F6F8',
  			bgHover: '#EEF1F4',
  			textPrimary: '#0B1F33',
  			textSecondary: '#4A5B6D',
  			textMuted: '#8B9AAB',
  			textFaint: '#B8C4D1',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  			},
  			boxShadow: {
  					xs: '0 1px 2px rgba(11,31,51,0.04)',
  					soft: '0 2px 8px rgba(11,31,51,0.05), 0 1px 2px rgba(11,31,51,0.03)',
  					md: '0 4px 16px rgba(11,31,51,0.06), 0 2px 4px rgba(11,31,51,0.03)',
  					lg: '0 8px 32px rgba(11,31,51,0.08), 0 4px 8px rgba(11,31,51,0.04)',
  					xl: '0 16px 56px rgba(11,31,51,0.10), 0 8px 16px rgba(11,31,51,0.05)',
  					gold: '0 2px 14px rgba(201,162,39,0.14)',
  					'gold-lg': '0 8px 32px rgba(201,162,39,0.20)',
  					},
  			keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to: { opacity: '1' },
  			},
  			'fade-in-up': {
  				from: { opacity: '0', transform: 'translateY(8px)' },
  				to: { opacity: '1', transform: 'translateY(0)' },
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.96)' },
  				to: { opacity: '1', transform: 'scale(1)' },
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s var(--ease-smooth)',
  			'fade-in-up': 'fade-in-up 0.4s var(--ease-smooth)',
  			'scale-in': 'scale-in 0.2s var(--ease-spring)',
  			'shimmer': 'shimmer 2s linear infinite',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
