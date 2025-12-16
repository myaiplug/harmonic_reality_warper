# Harmonic Reality Warper — MyAiPlug

A professional audio processing tool with a stunning landing page, built with the MyAiPlug design system.

## MyAiPlug Suite

This repository includes multiple plugin landing pages and demos:

- **Harmonic Reality Warper**: AI-powered harmonic warping and frequency manipulation
- **Temporal Pitch Portal**: Time stretching and pitch shifting with dimensional effects
- **Reverb De-Gloss**: AI-driven reverb removal for crystal-clear audio production

## Features

- 🎨 **MyAiPlug Aesthetics**: Consistent branding with the MyAiPlug ecosystem
- 🌓 **Dark Mode**: Beautiful light and dark themes with smooth transitions on both landing page and warper tool
- ⚡ **Fast & Modern**: Built with React + Vite + TailwindCSS v4
- 📱 **Fully Responsive**: Looks great on all devices
- 🚀 **Production Ready**: Optimized build and SEO-friendly
- 🎛️ **Real-time Audio Processing**: Hardware-style audio processor with Web Audio API
- 🎵 **Upload Your Audio**: Supports WAV, MP3, FLAC, and more audio formats
- 📊 **Live Visualization**: Real-time spectrum analyzer and meters
- 💾 **Export Processed Audio**: Download your processed audio as WAV files

## Project Structure

- **Landing Page** (`/` - React App): Marketing landing page with features, pricing, and call-to-action
- **Warper Tool** (`/warper.html`): Professional audio processing interface

## Audio Processing Features

### Real-time Processing
- Multi-band EQ (Low End, Mid Range, Presence, Air Band)
- Saturation/Drive with 3 models (Tape, Tube, Transformer)
- High-pass and Low-pass filters
- Bypass mode for A/B comparison
- Solo and Mute per frequency band
- Real-time spectrum analysis and metering

### Demo Mode
- Try the interface without uploading audio
- Download functionality is disabled in demo mode
- Upload your own audio to unlock full export capabilities

## Design Highlights

### Landing Page
- **Top Menu Bar**: Sticky header with MyAiPlug logo (icon + text), navigation links, and CTA buttons
- **Hero Section**: Compelling headline with emphasis on AI-powered harmonic warping
- **Features Grid**: 6 key benefits with icons and descriptions highlighting time-saving workflows
- **How It Works**: Step-by-step process breakdown
- **Pricing Tiers**: Three pricing options (Starter, Pro, Studio)
- **Call to Action**: Engaging final section with social proof
- **Footer**: Clean footer with copyright and links

### Warper Tool
- **Hardware-inspired UI**: Realistic plugin faceplate design with metallic textures
- **Interactive Controls**: Rotary knobs, switches, and toggles with smooth animations
- **Visual Feedback**: LED indicators, spectrum analyzer, and VU meters
- **Theme Toggle**: Switch between light and dark modes

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Visit the landing page at `/`
2. Click "Try Demo Now" to open the Harmonic Reality Warper
3. Upload your audio file or test with the interface in demo mode
4. Adjust EQ bands, drive, and filters to shape your sound
5. Listen to the real-time preview
6. Export your processed audio when ready

## Marketing Copy

The page emphasizes:
- ⏱️ **Time Saved**: "Save hours with MyAiPlug workflows"
- 🎯 **One-Click Effects**: "Pre-tuned GenAI workflows eliminate hours of tweaking"
- 🔥 **No Learning Curve**: "Click once, get professional results instantly"
- 💎 **Production Quality**: "From demo to master"
- 🌐 **Ecosystem Integration**: "Seamlessly connects with StemSplit, ScrewAI, and our entire suite"

## Brand Colors

The MyAiPlug brand uses a beautiful blue palette:
- Primary: `#2f7dff` (brand-500)
- Gradients from `#eef6ff` to `#0d2b60`

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Lightning-fast development and optimized builds
- **TailwindCSS v4**: Utility-first CSS with custom theme
- **PostCSS**: For processing CSS

## MyAiPlug Template

This serves as a template for creating new MyAiPlug.com pages with consistent branding, including:
- Shared header component with navigation
- Shared footer component
- Theme toggle functionality
- MyAiPlug color system
- Soft shadows and rounded corners
- Gradient backgrounds
- Professional typography

Perfect for quickly spinning up new tool pages in the MyAiPlug ecosystem!

## Additional Plugin Pages

### Reverb De-Gloss

A complete landing page and interactive demo for AI-powered reverb removal:

- **Landing Page**: `reverb-de-gloss.html` - Full marketing page with features, pricing, and CTAs
- **Interactive Demo**: `reverb-de-gloss-demo.html` - Working audio processor with real-time controls
- **Documentation**: `REVERB_DE_GLOSS.md` - Complete guide and technical details

See [REVERB_DE_GLOSS.md](REVERB_DE_GLOSS.md) for full documentation.

### Temporal Pitch Portal

Time manipulation and pitch shifting interface:

- **Demo**: `temporal-pitch-portal.html` - Full-featured audio time/pitch processor
- **Documentation**: `TEMPORAL_PITCH_PORTAL.md` - Usage guide and features

See [TEMPORAL_PITCH_PORTAL.md](TEMPORAL_PITCH_PORTAL.md) for details.

