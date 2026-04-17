# Frontend Setup Instructions

## Installation

After pulling the latest changes, you need to install the new dependencies:

```bash
cd Frontend
npm install
```

### New Dependencies Added:
- **tailwindcss** - Utility-first CSS framework
- **autoprefixer** - PostCSS plugin to parse CSS and add vendor prefixes
- **postcss** - Tool for transforming CSS with JavaScript
- **lucide-react** - Beautiful & consistent icon library
- **clsx** - Utility for constructing className strings conditionally
- **framer-motion** - Production-ready motion library for React
- **react-hot-toast** - Lightweight toast notifications

## What Changed

### Configuration Files Created:
1. `tailwind.config.js` - Tailwind CSS configuration with custom theme
2. `postcss.config.js` - PostCSS configuration
3. `src/design-system/constants.ts` - Design system tokens (colors, typography, spacing)
4. `src/lib/utils.ts` - Utility functions for className merging and formatting

### Files Modified:
1. `src/index.css` - Added Tailwind directives and custom utility classes
2. `package.json` - Added new dependencies

## Running the Application

```bash
npm run dev
```

The development server will start at http://localhost:5173

## Design System

The design system is now fully configured with:
- ✅ Custom color palette (primary, success, warning, danger, accent)
- ✅ Typography scale with Inter and Lexend fonts
- ✅ Spacing system (4px base unit)
- ✅ Shadow utilities for elevation
- ✅ Border radius tokens
- ✅ Animation keyframes and timing functions
- ✅ Responsive breakpoints
- ✅ Custom utility classes

## Using the Design System

### Colors
```tsx
<div className="bg-primary-500 text-white">Primary button</div>
<div className="bg-success-500">Success state</div>
<div className="bg-danger-500">Error state</div>
```

### Typography
```tsx
<h1 className="font-display text-4xl font-bold">Heading</h1>
<p className="text-base text-gray-700">Body text</p>
```

### Spacing
```tsx
<div className="p-6 m-4">Content with padding and margin</div>
```

### Shadows & Effects
```tsx
<div className="shadow-lg rounded-xl">Elevated card</div>
<div className="bg-gradient-primary">Gradient background</div>
<div className="glass">Glass morphism effect</div>
```

### Animations
```tsx
<div className="animate-fade-in">Fade in on mount</div>
<div className="animate-bounce-in">Bounce in animation</div>
```

### Icons (Lucide React)
```tsx
import { Heart, Star, CheckCircle } from 'lucide-react';

<Heart className="w-5 h-5 text-danger-500" />
<Star className="w-6 h-6 text-warning-500" />
<CheckCircle className="w-4 h-4 text-success-500" />
```

### Utility Functions
```tsx
import { cn, formatRelativeTime, formatPercentage } from '@/lib/utils';

// Conditional classes
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes'
)} />

// Format time
formatRelativeTime(new Date()) // "2 minutes ago"

// Format percentage
formatPercentage(85.5, 1) // "85.5%"
```

## Next Steps

Now that the design system is set up, we'll create:
1. Shared UI components (Button, Card, Badge, Modal, etc.)
2. Enhanced page designs for all features
3. Smooth animations and transitions
4. Responsive design testing

## Troubleshooting

### Tailwind classes not working
- Make sure you ran `npm install`
- Restart the dev server
- Check that `index.css` is imported in your main file

### Fonts not loading
- The Google Fonts are loaded via CDN in `index.css`
- If offline, fonts will fallback to system fonts

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
