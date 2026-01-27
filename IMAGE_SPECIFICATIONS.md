# Image Specifications for Base Mini App

## Quick Reference

All images should be placed in the `/public` directory.

| Image | Filename | Size | Format | Notes |
|-------|----------|------|--------|-------|
| **App Icon** | `icon.png` | 512x512px | PNG (transparent) | Square app icon |
| **Splash Screen** | `splash.png` | 1080x1920px | PNG | Portrait, dark background (#030712) |
| **Embed Preview** | `embed-image.png` | 1200x630px | PNG/JPG | Shown when shared |
| **Hero Image** | `hero.png` | 1200x630px | PNG/JPG | App directory feature image |
| **OG Image** | `og-image.png` | 1200x630px | PNG/JPG | Social media preview |
| **Screenshot 1** | `screenshot-1.png` | 1080x1920px | PNG/JPG | Main globe view |
| **Screenshot 2** | `screenshot-2.png` | 1080x1920px | PNG/JPG | Country details/stats |
| **Screenshot 3** | `screenshot-3.png` | 1080x1920px | PNG/JPG | Base ecosystem view |

## Detailed Specifications

### 1. App Icon (`icon.png`)
```
Dimensions: 512x512px (minimum), 1024x1024px (recommended)
Format: PNG with transparency
Aspect Ratio: 1:1 (square)
File Size: < 1MB
Background: Transparent or solid color
Design: Simple, recognizable globe or world icon
```

### 2. Splash Screen (`splash.png`)
```
Dimensions: 1080x1920px
Format: PNG
Aspect Ratio: 9:16 (portrait)
File Size: < 2MB
Background Color: #030712 (dark blue-gray to match app)
Design: 
  - Centered logo/icon
  - Optional: "Builder Globe" text
  - Optional: "Powered by Talent Protocol" text
  - Optional: Loading indicator
```

### 3. Embed Preview (`embed-image.png`)
```
Dimensions: 1200x630px
Format: PNG or JPG
Aspect Ratio: 1.91:1
File Size: < 1MB
Design:
  - Show the 3D globe with highlighted countries
  - Include "Builder Globe" branding
  - Optional: Key stats overlay
  - High contrast for visibility in feeds
```

### 4. Hero Image (`hero.png`)
```
Dimensions: 1200x630px
Format: PNG or JPG
Aspect Ratio: 1.91:1
File Size: < 1MB
Design:
  - Featured/hero shot of the app
  - Show main interface with globe
  - Include branding
  - Professional, polished look
```

### 5. OG Image (`og-image.png`)
```
Dimensions: 1200x630px
Format: PNG or JPG
Aspect Ratio: 1.91:1
File Size: < 1MB
Design:
  - Can be same as hero or embed image
  - Optimized for social media sharing
  - Clear, readable text if included
  - Represents app's core value
```

### 6. Screenshots (3 required)

#### Screenshot 1: Main Globe View
```
Filename: screenshot-1.png
Dimensions: 1080x1920px (portrait) or 1920x1080px (landscape)
Format: PNG or JPG
Content: 
  - Full globe view with countries highlighted
  - Show color-coded countries by builder count
  - Include UI elements (header, panels)
  - Demonstrate main interface
```

#### Screenshot 2: Country Details
```
Filename: screenshot-2.png
Dimensions: 1080x1920px (portrait) or 1920x1080px (landscape)
Format: PNG or JPG
Content:
  - Country detail modal open
  - Show builder list or stats panel
  - Demonstrate data visualization
  - Highlight key metrics
```

#### Screenshot 3: Base Ecosystem
```
Filename: screenshot-3.png
Dimensions: 1080x1920px (portrait) or 1920x1080px (landscape)
Format: PNG or JPG
Content:
  - Base ecosystem filter active
  - Show filtered results
  - Highlight Base-specific features
  - Demonstrate ecosystem integration
```

## Design Guidelines

### Color Palette (from app)
- **Primary Background**: `#030712` (dark blue-gray)
- **Primary Accent**: `#2563EB` (blue-600)
- **Text**: White with various opacities
- **Glass Effect**: White with low opacity + blur

### Typography
- **Primary Font**: System UI, -apple-system, sans-serif
- **Headings**: Bold, white
- **Body**: Regular, white/60-70% opacity

### Branding Elements
- **App Name**: "Builder Globe"
- **Tagline**: "Discover builders worldwide" or "Explore builders around the world"
- **Powered By**: "Talent Protocol" (with logo if available)

## Where to Place Images

All images should be placed in:
```
/public/
  ├── icon.png
  ├── splash.png
  ├── embed-image.png
  ├── hero.png
  ├── og-image.png
  ├── screenshot-1.png
  ├── screenshot-2.png
  └── screenshot-3.png
```

## Testing Images

After adding images, verify they're accessible at:
- `https://your-domain.com/icon.png`
- `https://your-domain.com/splash.png`
- etc.

Use the [Base Build Preview Tool](https://www.base.dev/preview) to test how images appear in the Base app.
