# MyAiPlug Template Usage Guide

This template provides a consistent, branded foundation for all MyAiPlug.com tool pages.

## Quick Start

1. **Clone this repository** as a starting point for your new tool
2. **Update the content** in `src/App.jsx`:
   - Change the hero headline and description
   - Update the feature cards (6 benefits)
   - Modify the "How It Works" steps
   - Adjust pricing tiers if needed
3. **Update meta tags** in `index.html`:
   - Change the title
   - Update the description
   - Modify Open Graph tags
4. **Run and test**:
   ```bash
   npm install
   npm run dev
   ```

## What's Included

### Header (Top Menu Bar)
- **Logo**: AI icon + "MyAiPlug" text
- **Navigation**: Features, How It Works, Pricing, More Tools
- **Actions**: Sign In and Get Started buttons
- **Behavior**: Sticky, semi-transparent with backdrop blur

### Theme Toggle
- Bottom-right floating button
- Switches between light and dark modes
- Persists preference in localStorage
- Smooth transitions

### Footer
- Copyright notice with current year
- Links to More Tools, Privacy, Terms
- Consistent styling with header

### Color System
All MyAiPlug brand colors are pre-configured:
- `brand-500`: #2f7dff (primary)
- `brand-50` to `brand-900`: Full blue palette
- Gradient backgrounds
- Soft shadows

### Marketing Sections
1. **Hero**: Large headline, description, dual CTAs
2. **Features Grid**: 6 cards with icons and descriptions
3. **How It Works**: 4-step numbered process
4. **Pricing**: 3-tier pricing cards
5. **Final CTA**: Gradient background with strong call-to-action
6. **Footer**: Links and copyright

## Customization Guide

### Changing the Tool Name
Search and replace "Harmonic Reality Warper" with your tool name in:
- `index.html` (title and meta tags)
- `src/App.jsx` (hero section)

### Updating Features
Edit the feature cards in `src/App.jsx`. Each card has:
- Emoji icon (change to match your tool)
- Title
- Description

Keep descriptions concise and benefit-focused.

### Modifying Pricing
Update the pricing section in `src/App.jsx`:
- Tier names
- Prices
- Feature lists
- CTA button text and links

### Adding New Sections
Follow the existing pattern:
```jsx
<section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
    Your Section Title
  </h2>
  {/* Your content */}
</section>
```

## Design Principles

### Consistency
- All pages use the same header and footer
- Identical color scheme and typography
- Uniform spacing and sizing

### Responsive
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly buttons

### Performance
- Optimized builds with Vite
- Minimal bundle size
- Fast page loads

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- High contrast ratios

## Marketing Copy Guidelines

Always emphasize:
1. **Time Savings**: "Save hours with MyAiPlug workflows"
2. **Ease of Use**: "One-click effects", "No learning curve"
3. **Quality**: "Production-ready", "Professional results"
4. **AI Power**: "GenAI workflows", "AI-powered"
5. **Integration**: "MyAiPlug ecosystem", "Seamless connection"

### Writing Style
- **Confident**: "Revolutionary", "Legendary", "Transform"
- **Benefit-focused**: Lead with what users gain
- **Concise**: Short sentences, clear value props
- **Action-oriented**: Strong verbs, clear CTAs

## Development

### Commands
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### File Structure
```
├── public/
│   └── favicon.svg         # MyAiPlug logo
├── src/
│   ├── App.jsx            # Main component (edit this!)
│   ├── index.css          # TailwindCSS + custom theme
│   └── main.jsx           # Entry point
├── index.html             # HTML template
├── package.json           # Dependencies
├── postcss.config.js      # PostCSS setup
└── vite.config.js         # Vite configuration
```

## Deployment

This template works with any static hosting:
- **Vercel**: `npm run build` → deploy `dist/`
- **Netlify**: Same as above
- **GitHub Pages**: Configure base in `vite.config.js`
- **Cloudflare Pages**: Automatic builds

## Tips

1. **Keep it consistent**: Don't deviate from the design system
2. **Test dark mode**: Toggle theme and check all sections
3. **Mobile-first**: Test responsive behavior
4. **SEO**: Update all meta tags for each tool
5. **Performance**: Keep images optimized and bundle small

## Support

For questions about the template:
- Check the main MyAiPlug landing repository
- Review other tool pages for examples
- Follow the brand guidelines

---

**Remember**: This template ensures every MyAiPlug tool page has the same professional look and feel, building trust and brand recognition across the entire ecosystem.
