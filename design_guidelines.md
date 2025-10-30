# Ceylon Expand Design Guidelines

## Design Approach
**Reference-Based**: Drawing from Airbnb's sophisticated minimalism and premium travel platforms. Focus on immersive imagery showcasing Sri Lanka's beauty, generous whitespace, and effortless navigation that lets content breathe.

## Core Design Principles
- **Premium Minimalism**: Every element earns its place through purpose
- **Image-First Storytelling**: Sri Lankan landscapes, culture, and experiences drive engagement
- **Breathing Room**: Generous spacing creates sophistication and visual hierarchy
- **Frictionless Discovery**: Clean pathways to exploration without visual noise

---

## Typography System

**Primary Font**: Inter or DM Sans (Google Fonts)
- Hero Headline: 64px/72px (desktop), 40px/48px (mobile), weight 700
- Section Headers: 48px/56px (desktop), 32px/40px (mobile), weight 600
- Subheadings: 24px/32px, weight 500
- Body Text: 16px/24px, weight 400
- Small Text: 14px/20px, weight 400
- Buttons: 16px, weight 500, uppercase tracking (0.5px)

**Secondary Font**: Georgia or Lora for elegant accents in testimonials/quotes only

---

## Layout System

**Spacing Scale**: Tailwind units of 4, 6, 8, 12, 16, 20, 24 (as in p-4, gap-8, my-16, py-24)
- Component padding: 6-8 units
- Section vertical spacing: 20-24 units (desktop), 12-16 (mobile)
- Card gaps: 6-8 units
- Element spacing: 4-6 units

**Container Strategy**:
- Full-width sections with inner max-w-7xl
- Content sections: max-w-6xl
- Text-heavy areas: max-w-4xl
- Forms: max-w-2xl

---

## Component Library

### Navigation
**Desktop Header**: Full-width, translucent background (backdrop-blur), fixed position
- Logo (left, height 40px)
- Center navigation: Destinations, Experiences, About, Contact (horizontal, 16px spacing)
- Right: Search icon, Language selector, "Plan Your Trip" primary CTA button

**Mobile Header**: Simplified with hamburger menu, logo centered

### Hero Section
**Immersive Full-Screen Hero** (90vh minimum):
- Large background image: Stunning Sri Lankan landscape (Sigiriya, tea plantations, beaches, or wildlife)
- Subtle dark gradient overlay (20% opacity) for text readability
- Centered content stack:
  - Main headline (white, max-w-4xl)
  - Supporting tagline (16px, subtle opacity)
  - Search/Filter bar component (glass-morphism effect with backdrop-blur, rounded corners, shadow-lg)
  - Secondary CTA button with blurred background (backdrop-blur-md, semi-transparent white/20% opacity)

### Destination/Experience Cards
**Grid Layout**: 3 columns desktop, 2 tablet, 1 mobile (gap-8)
- Card structure:
  - Image (16:10 aspect ratio, rounded corners, hover: subtle scale 1.02)
  - Content padding (p-6)
  - Location tag (small, subtle background)
  - Title (24px, weight 600, mb-2)
  - Brief description (2 lines max, 14px)
  - Price/duration indicator (bold, accent treatment)
  - "Explore" link (minimal underline on hover)

### Feature Highlights Section
**Two-Column Layout** (alternating image-text):
- Left: Large image (rounded-lg, 3:2 aspect ratio)
- Right: Content block (max-w-xl, self-center)
  - Icon/visual accent (48px, subtle)
  - Heading (32px)
  - Description (16px, line-height relaxed)
  - List of benefits (checkmark icons, 4-unit spacing)
  
Alternate layout on subsequent features (image right, text left)

### Trust Section
**Centered Stack**:
- Heading: "Trusted by Travelers Worldwide"
- Stats row (3-4 columns, text-center):
  - Large number (48px, weight 700)
  - Label below (14px, subtle)
- Testimonial cards (2 columns, gap-8):
  - Avatar image (56px circle)
  - Quote (italic, 18px)
  - Name + location (14px, weight 500)

### CTA Section
**Full-Width Banner** (background: Sri Lankan sunset/landscape with 40% dark overlay):
- Centered content (max-w-3xl):
  - Compelling headline (48px white)
  - Supporting text (18px, mb-8)
  - Primary CTA button (large, backdrop-blur-md background)

### Footer
**Multi-Column Layout** (4 columns desktop, stack mobile):
- Column 1: Brand logo, tagline, social icons
- Column 2: Quick Links (Destinations, Experiences, About)
- Column 3: Support (Contact, FAQ, Terms)
- Column 4: Newsletter signup form (email input + button, max-w-sm)
- Bottom bar: Copyright, privacy links (14px, subtle, border-top)

---

## Interactive Elements

**Buttons**:
- Primary: Medium size (px-8, py-3), rounded-full, weight 500, shadow-md
- Secondary: Outlined version, transparent with border
- Glass-morphic (on images): backdrop-blur-md, semi-transparent white (20-30% opacity), border subtle
- All buttons: No custom hover states needed (engineer implements standard great-looking states)

**Search/Filter Bar**:
- Horizontal layout: Location dropdown | Date picker | Guests selector | Search button
- Glass-morphic treatment: backdrop-blur-lg, subtle shadow-2xl
- Rounded-2xl, padding p-2
- Individual inputs with subtle dividers

**Cards**:
- Border: None or very subtle (1px, low opacity)
- Shadow: Default shadow-md, hover shadow-xl
- Transition: All 200ms ease
- Rounded: rounded-xl

---

## Images Section

**Hero Image**: 
- Full-width, 90vh minimum height
- High-resolution Sri Lankan landmark (Sigiriya Rock, Ella train bridge, Mirissa beach, tea plantations, or Yala safari)
- Subtle gradient overlay for text contrast
- Position: Cover, center-center

**Destination Cards** (12-16 images):
- Diverse Sri Lankan locations: beaches, mountains, cultural sites, wildlife, tea country
- 16:10 aspect ratio
- Professional photography showcasing experiences

**Feature Section Images** (3-4 images):
- 3:2 aspect ratio, landscape orientation
- Showcase: Local guides, authentic experiences, group travelers, cultural immersion
- High quality, natural lighting

**Background Accent Images**:
- CTA section: Panoramic Sri Lankan sunset/landscape
- About section: Pattern/texture from Sri Lankan art/culture (subtle, low opacity)

**Trust Section**:
- Testimonial avatars: 6-8 traveler photos (diverse, authentic, 1:1 ratio)

---

## Animations
**Minimal & Purposeful**:
- Image hover: Scale 1.02, 300ms ease
- Card hover: Lift shadow-md to shadow-xl, 200ms
- Page load: Hero content fade-up (600ms, ease-out)
- Scroll reveal: Sections fade-up when entering viewport (stagger 100ms)
- NO parallax, NO complex scroll-driven animations

---

## Responsive Behavior
- Desktop (1280px+): Full multi-column layouts
- Tablet (768-1279px): 2-column grids, simplified navigation
- Mobile (<768px): Single column, stacked sections, hamburger menu, touch-optimized (48px minimum touch targets)

**Section Count**: 7-9 sections total:
1. Hero with search
2. Featured destinations (grid)
3. Why Choose Us (features)
4. Popular experiences
5. Trust/testimonials
6. How it works
7. CTA banner
8. Footer

This creates a comprehensive, premium travel platform with sophisticated minimalism and Sri Lankan beauty at its core.