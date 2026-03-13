# Pokemon Card Binder Manager - Specification

## 1. Project Overview
- **Project Name**: PokeBinder
- **Type**: Web Application
- **Core Functionality**: Manage a virtual Pokemon card binder with customizable grid layouts, tracking which cards you own vs. wish to have
- **Target Users**: Pokemon card collectors

## 2. Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js with Google Provider
- **Database**: SQLite (dev) / PostgreSQL + Supabase (prod)
- **ORM**: Prisma
- **Pokemon API**: Pokemon TCG API (https://api.pokemontcg.io)
- **Styling**: CSS Modules

## 3. UI/UX Specification

### Layout Structure
- **Header**: Logo, user avatar, sign out button
- **Main Content**: Binder view with page navigation
- **Modal**: Card picker/search overlay

### Visual Design
- **Color Palette**:
  - Background: `#1a1a2e` (dark navy)
  - Card Background: `#16213e` (darker navy)
  - Accent: `#e94560` (pokemon red)
  - Text Primary: `#eaeaea`
  - Text Secondary: `#a0a0a0`
  - Wish List (grayed): `opacity: 0.5`
  - Owned (solid): `opacity: 1`
- **Typography**:
  - Font: `"Archivo Black", sans-serif` for headings
  - Body: `"DM Sans", sans-serif`
- **Spacing**: 8px base unit
- **Border Radius**: 8px for cards, 12px for binder pages

### Components
1. **Binder Page**: Grid of card slots (default 4x4 = 16 slots)
2. **Card Slot**: 
   - Empty state: dashed border, "+" icon
   - Filled state: Pokemon card image
   - Owned: solid border `#4ade80` (green)
   - Wish: dashed border `#f59e0b` (amber), grayed out
3. **Page Navigator**: Previous/Next buttons, page indicator
4. **Card Picker Modal**: Search Pokemon cards, select owned/wish
5. **Binder Settings**: Configure grid size (rows x cols), page count

## 4. Data Models

### User
- id, email, name, image

### Binder
- id, userId, name, rows, cols, pages, createdAt, updatedAt

### CardSlot
- id, binderId, pageNumber, slotIndex, pokemonId, cardName, cardImageUrl, status (owned/wish)

## 5. API Endpoints
- `GET /api/binders` - List user's binders
- `POST /api/binders` - Create new binder
- `GET /api/binders/[id]` - Get binder with cards
- `PUT /api/binders/[id]` - Update binder settings
- `DELETE /api/binders/[id]` - Delete binder
- `PUT /api/binders/[id]/cards/[slotId]` - Update card in slot
- `GET /api/cards/search?q=` - Search Pokemon TCG API

## 6. Pages
1. `/` - Landing (redirect to dashboard or login)
2. `/dashboard` - List of user's binders
3. `/binder/[id]` - View/edit specific binder
4. `/binder/[id]/settings` - Binder settings

## 7. Acceptance Criteria
- [ ] User can sign in with Google
- [ ] User can create a binder with custom rows, cols, and pages
- [ ] User can navigate between binder pages
- [ ] User can add a card to any slot via search
- [ ] User can mark card as "owned" or "wish"
- [ ] Owned cards display at full opacity with green border
- [ ] Wish cards display at 50% opacity with amber dashed border
- [ ] User can remove a card from a slot
- [ ] User can delete entire binder
- [ ] Data persists across sessions
