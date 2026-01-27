# Base Mini App Integration Setup Guide

This document outlines the steps needed to complete the Base Mini App integration for Builder Globe.

## ✅ Completed Steps

1. **Installed @farcaster/miniapp-sdk** - The SDK has been added to the project
2. **Added SDK initialization** - `sdk.actions.ready()` is called in the main page component
3. **Created manifest route** - Route handler at `src/app/.well-known/farcaster.json/route.ts`
4. **Added embed metadata** - Updated `layout.tsx` with `fc:miniapp` metadata

## 🎨 Required Images

You need to create and provide the following images. Place them in the `/public` directory:

### 1. **App Icon** (`/public/icon.png`)
- **Size**: 512x512px (recommended)
- **Format**: PNG with transparency
- **Purpose**: App icon shown in listings and menus
- **Design**: Should represent the Builder Globe brand (globe/world icon)

### 2. **Splash Image** (`/public/splash.png`)
- **Size**: 1080x1920px (portrait, 9:16 aspect ratio)
- **Format**: PNG
- **Background**: Should match `#030712` (dark blue-gray)
- **Purpose**: Loading screen shown when app launches
- **Design**: Can include logo, tagline, or branded loading animation

### 3. **Embed Image** (`/public/embed-image.png`)
- **Size**: 1200x630px (recommended OG image size)
- **Format**: PNG or JPG
- **Purpose**: Preview image when app is shared in posts
- **Design**: Should show the globe visualization or key app feature

### 4. **Hero Image** (`/public/hero.png`)
- **Size**: 1200x630px (recommended)
- **Format**: PNG or JPG
- **Purpose**: Featured image in app directory/store
- **Design**: Showcase the main globe interface

### 5. **OG Image** (`/public/og-image.png`)
- **Size**: 1200x630px (standard OG image)
- **Format**: PNG or JPG
- **Purpose**: Social media sharing preview
- **Design**: Can be same as hero image or embed image

### 6. **Screenshots** (3 required)
- **Files**: `/public/screenshot-1.png`, `/public/screenshot-2.png`, `/public/screenshot-3.png`
- **Size**: 1080x1920px (portrait) or 1920x1080px (landscape)
- **Format**: PNG or JPG
- **Purpose**: App store/directory screenshots
- **Design**: Show key features:
  - Screenshot 1: Main globe view with countries highlighted
  - Screenshot 2: Country detail modal or stats panel
  - Screenshot 3: Base ecosystem filter view

## 🔧 Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_URL=https://your-production-domain.com
```

Replace `your-production-domain.com` with your actual deployed URL.

## 📝 Manifest Configuration Steps

### Step 1: Deploy Your App
Deploy your app to production so the manifest is accessible at:
```
https://your-domain.com/.well-known/farcaster.json
```

### Step 2: Generate Account Association Credentials
1. Go to [Base Build Account Association Tool](https://www.base.dev/preview?tab=account)
2. Enter your app URL (e.g., `your-domain.vercel.app`)
3. Click "Submit" and then "Verify"
4. Follow the instructions to sign with your Base Account
5. Copy the generated `accountAssociation` fields

### Step 3: Update Manifest with Credentials
Update the `accountAssociation` section in `src/app/.well-known/farcaster.json/route.ts`:

```typescript
accountAssociation: {
  header: "your-generated-header",
  payload: "your-generated-payload",
  signature: "your-generated-signature"
}
```

## 🧪 Testing Your Integration

### Step 1: Preview in Base Build
1. Go to [Base Build Preview Tool](https://www.base.dev/preview)
2. Enter your app URL
3. Verify embeds, launch button, account association, and metadata

### Step 2: Test Account Association
1. Go to the "Account association" tab in Base Build
2. Verify the credentials are valid

### Step 3: Check Metadata
1. Go to the "Metadata" tab in Base Build
2. Review all manifest fields
3. Ensure all required images are loading

## 🚀 Publishing Your Mini App

### Final Checks
- [ ] All images are uploaded and accessible
- [ ] Environment variable `NEXT_PUBLIC_URL` is set correctly
- [ ] Manifest is accessible at `/.well-known/farcaster.json`
- [ ] Account association credentials are added
- [ ] App tested in Base Build preview tool

### Publish
1. Open the Base app
2. Create a new post
3. Include your app's URL in the post
4. The app will be published and available in the Base app directory

## 📚 Additional Resources

- [Base Mini Apps Documentation](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps)
- [Build Checklist](https://docs.base.org/mini-apps/quickstart/build-checklist)
- [Manifest Reference](https://docs.base.org/mini-apps/core-concepts/manifest)
- [Embeds and Previews](https://docs.base.org/mini-apps/core-concepts/embeds-and-previews)
- [Sign Manifest Guide](https://docs.base.org/mini-apps/technical-guides/sign-manifest)
