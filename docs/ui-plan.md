# UI Plan — OptiSuite

> Screen inventory, navigation structure, design system, and responsive behavior.

---

## 1. Design Philosophy

### Core Principles
1. **Mobile-first** — Primary usage device is a phone; desktop is an enhanced experience, not the base
2. **Optical-industry professional** — Clean, trustworthy, medical-grade feel
3. **Speed over beauty** — Billing and order creation must be fast; no unnecessary clicks
4. **Accessible** — High contrast ratios, readable fonts, touch-friendly tap targets (min 44px)
5. **Bilingual-ready** — All text sourced from i18n; layout must handle Hindi string lengths (typically 20-40% longer than English)

---

## 2. Color Palette

Inspired by the teal-emerald tone in the reference product, refined for a premium feel:

### Primary Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-50` | `#E6F7F5` | Lightest backgrounds, hover states |
| `--color-primary-100` | `#B3E8E2` | Light badges, selected states |
| `--color-primary-200` | `#80D9CF` | Borders, secondary accents |
| `--color-primary-300` | `#4DCABC` | Links, icons |
| `--color-primary-400` | `#26BDA9` | Active states |
| `--color-primary-500` | `#0D9488` | **Primary brand color** |
| `--color-primary-600` | `#0B7E74` | Primary hover |
| `--color-primary-700` | `#096860` | Primary active |
| `--color-primary-800` | `#07524C` | Dark accents |
| `--color-primary-900` | `#043C38` | Deepest tones |

### Neutral Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-neutral-0` | `#FFFFFF` | Backgrounds |
| `--color-neutral-50` | `#F8FAFA` | Page background |
| `--color-neutral-100` | `#F1F5F5` | Card backgrounds |
| `--color-neutral-200` | `#E2EAEA` | Borders, dividers |
| `--color-neutral-300` | `#C4D4D4` | Disabled text |
| `--color-neutral-400` | `#94A8A8` | Placeholder text |
| `--color-neutral-500` | `#6B8080` | Secondary text |
| `--color-neutral-600` | `#4A5F5F` | Body text |
| `--color-neutral-700` | `#334545` | Heading text |
| `--color-neutral-800` | `#1F2E2E` | Primary text |
| `--color-neutral-900` | `#0F1A1A` | Darkest text |

### Semantic Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#10B981` | Success, delivered, paid |
| `--color-success-light` | `#D1FAE5` | Success background |
| `--color-warning` | `#F59E0B` | Warning, partial, processing |
| `--color-warning-light` | `#FEF3C7` | Warning background |
| `--color-error` | `#EF4444` | Error, cancelled, overdue |
| `--color-error-light` | `#FEE2E2` | Error background |
| `--color-info` | `#3B82F6` | Info, pending |
| `--color-info-light` | `#DBEAFE` | Info background |

### Gradient
```css
--gradient-primary: linear-gradient(135deg, #0D9488 0%, #065F56 100%);
--gradient-card: linear-gradient(180deg, #0D9488 0%, #07524C 100%);
--gradient-bg: linear-gradient(180deg, #E6F7F5 0%, #F8FAFA 100%);
```

---

## 3. Typography

### Font Family
- **Primary**: `'Inter'` (Google Fonts) — clean, professional, excellent for data-heavy UIs
- **Hindi**: `'Noto Sans Devanagari'` (Google Fonts) — matches Inter's weight and style
- **Monospace**: `'JetBrains Mono'` — for numbers, codes, financial data

### Scale
| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-xs` | 11px | 400 | Fine print, timestamps |
| `--text-sm` | 13px | 400 | Secondary text, labels |
| `--text-base` | 15px | 400 | Body text |
| `--text-md` | 17px | 500 | Emphasized body |
| `--text-lg` | 20px | 600 | Section headers |
| `--text-xl` | 24px | 700 | Page titles |
| `--text-2xl` | 30px | 700 | Dashboard KPIs |
| `--text-3xl` | 36px | 800 | Hero numbers |

---

## 4. Spacing & Layout

### Spacing Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 20px;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(15, 26, 26, 0.05);
--shadow-md: 0 4px 12px rgba(15, 26, 26, 0.08);
--shadow-lg: 0 8px 24px rgba(15, 26, 26, 0.12);
--shadow-xl: 0 16px 48px rgba(15, 26, 26, 0.16);
```

---

## 5. Breakpoints & Responsive Behavior

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 768px | Single column, bottom nav, full-width cards |
| **Tablet** | 768px–1023px | Collapsible sidebar, 2-column where useful |
| **Desktop** | >= 1024px | Fixed sidebar, master-detail split views |
| **Wide** | >= 1440px | Wider content area, more whitespace |

### Mobile Navigation
- **Bottom navigation bar** (fixed): Home, Customers, Orders, Products
- **More menu** (accessible from bottom nav or hamburger): Purchases, Eye Tests, Offers, Expenses, Membership, Settings

### Desktop Navigation
- **Sidebar** (collapsible): All modules listed vertically
- **Top bar**: Shop name + logo, notification bell, user avatar + dropdown
- **Content area**: Master-detail split view for list screens

---

## 6. Screen Inventory

### 6.1 Auth Screens
| Screen | Route | Layout |
|--------|-------|--------|
| Login | `/login` | Centered card, no nav |

### 6.2 Dashboard
| Screen | Route | Layout |
|--------|-------|--------|
| Home Dashboard | `/` | KPI cards, quick actions, orders due, revenue chart |

### 6.3 Customers
| Screen | Route | Layout |
|--------|-------|--------|
| Customer List | `/customers` | Searchable list with detail panel |
| Customer Profile | `/customers/[id]` | Full profile page (mobile) |
| Add/Edit Customer | `/customers/new` or `/customers/[id]/edit` | Form (modal on desktop, page on mobile) |

### 6.4 Orders
| Screen | Route | Layout |
|--------|-------|--------|
| Order List | `/orders` | Filterable list with detail panel |
| Order Detail | `/orders/[id]` | Full detail page |
| Create Order | `/orders/new?type=spectacles` | Multi-step form |

### 6.5 Products
| Screen | Route | Layout |
|--------|-------|--------|
| Product List | `/products` | Filterable list with detail panel |
| Add/Edit Product | `/products/new` or `/products/[id]/edit` | Form |

### 6.6 Purchases
| Screen | Route | Layout |
|--------|-------|--------|
| Purchase Bills | `/purchases` | List with filters |
| New Purchase Bill | `/purchases/new` | Form |
| Vendors | `/purchases/vendors` | List + detail |
| Vendor Ledger | `/purchases/vendors/[id]/ledger` | Chronological view |
| Vendor Payments | `/purchases/payments` | Payment list |

### 6.7 Eye Tests
| Screen | Route | Layout |
|--------|-------|--------|
| Eye Test List | `/eye-tests` | Searchable list with detail |
| Eye Test Form | `/eye-tests/new` | Full prescription form |
| Eye Test Detail | `/eye-tests/[id]` | Detail view |

### 6.8 Lens Power Tools
| Screen | Route | Layout |
|--------|-------|--------|
| Tools Page | `/tools` | Transposition + CL conversion calculators |

### 6.9 Offers
| Screen | Route | Layout |
|--------|-------|--------|
| Offers List | `/offers` | Overview cards + list |
| Create Offer | `/offers/new` | Form |

### 6.10 Expenses
| Screen | Route | Layout |
|--------|-------|--------|
| Expenses List | `/expenses` | Overview cards + filtered list |
| Add Expense | `/expenses/new` | Form |

### 6.11 Membership
| Screen | Route | Layout |
|--------|-------|--------|
| Membership Overview | `/membership` | Tiers + issued cards tabs |
| Create Tier | `/membership/tiers/new` | Form |

### 6.12 Reports
| Screen | Route | Layout |
|--------|-------|--------|
| Reports Dashboard | `/reports` | Chart-heavy analytics page |

### 6.13 Settings
| Screen | Route | Layout |
|--------|-------|--------|
| Settings | `/settings` | Multi-section settings page |

### 6.14 Chatbot
| Component | Type | Layout |
|-----------|------|--------|
| Help Widget | Floating overlay | Bottom-right FAB, expandable chat panel |

---

## 7. Component Library

### Core Components
| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, outline, ghost, danger variants |
| `Input` | Text, number, tel, email, search with label + error |
| `Select` | Single select dropdown |
| `MultiSelect` | Tag-based multi-select |
| `Textarea` | Multi-line text input |
| `DatePicker` | Calendar date selection |
| `DateRangePicker` | From/to date selection |
| `Toggle` | On/off switch |
| `Checkbox` | Multi-option selection |
| `Radio` | Single-option selection |
| `Badge` | Status indicators (Pending, Paid, etc.) |
| `Avatar` | User/customer profile image |
| `Card` | Content container with shadow |
| `Modal` | Overlay dialog |
| `Drawer` | Slide-in panel (mobile) |
| `Toast` | Notification popup |
| `Skeleton` | Loading placeholder |
| `EmptyState` | No-data illustration + CTA |
| `Tabs` | Tab navigation |
| `Stepper` | Multi-step progress (order creation) |
| `SearchInput` | Search with debounce |
| `DataTable` | Sortable, filterable table |
| `Pagination` | Page navigation |

### Domain-Specific Components
| Component | Description |
|-----------|-------------|
| `PrescriptionForm` | SPH/CYL/AXIS/ADD/PD/Prism for both eyes |
| `OrderProgressStepper` | Pending → Processing → Ready → Delivered |
| `KPICard` | Dashboard metric with change indicator |
| `RevenueChart` | Bar chart with period toggle |
| `StatusBadge` | Color-coded status pill |
| `PaymentSummary` | Subtotal → Discount → Tax → Total → Paid → Due |
| `ProductCard` | Product image + name + price + stock |
| `CustomerCard` | Avatar + name + phone + due amount |
| `OrderCard` | Order ID + status + customer + amount |

---

## 8. Animations & Micro-Interactions

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Page transition | Fade + slide up | 200ms |
| Modal open | Backdrop fade + scale in | 250ms |
| Modal close | Scale out + fade | 200ms |
| Drawer slide | Slide from right/bottom | 300ms ease-out |
| Button press | Scale down to 0.97 | 100ms |
| Card hover | Lift (translateY -2px) + shadow increase | 150ms |
| Status badge change | Color pulse | 400ms |
| Toast appear | Slide down + fade in | 300ms |
| Toast dismiss | Slide up + fade out | 200ms |
| Loading skeleton | Shimmer gradient sweep | 1.5s infinite |
| KPI counter | Number count-up animation | 600ms |
| Tab switch | Indicator slide + content crossfade | 200ms |
| Sidebar collapse | Width transition | 250ms ease |
| FAB press | Ripple effect | 300ms |
| Form field focus | Border color transition | 150ms |
| Stepper progress | Fill animation left-to-right | 300ms |

All animations use `prefers-reduced-motion: reduce` media query to disable for accessibility.

---

## 9. Mobile-Specific Patterns

### Bottom Sheet
Used for: Quick actions, filters, sort options on mobile. Slides up from bottom with drag-to-dismiss.

### Pull-to-Refresh
Used on: List screens (orders, customers, products). Visual indicator with spinner.

### Swipe Actions
Used on: List items for quick actions (e.g., swipe left to delete/archive).

### Touch Targets
All interactive elements minimum 44x44px. Extra padding on mobile for fat-finger safety.

### Keyboard Handling
Prescription number inputs use `inputMode="decimal"` for numeric keyboard on mobile. Phone fields use `inputMode="tel"`.

---

## 10. Dark Mode (Future)

Design tokens structured to support dark mode via CSS custom properties swap. Not in initial release but architecture supports it.

```css
[data-theme="dark"] {
  --color-neutral-0: #0F1A1A;
  --color-neutral-50: #1A2828;
  /* ... inverted neutral scale ... */
}
```

---

## 11. Order Creation Flow — Detailed UX

### Multi-Step Wizard (Mobile)
```
Step 1: Customer        Step 2: Prescription      Step 3: Products
┌──────────────┐       ┌──────────────┐          ┌──────────────┐
│ Search or    │       │ R.E  L.E     │          │ Frame search │
│ create new   │  -->  │ SPH  SPH     │  -->     │ Lens type    │
│ customer     │       │ CYL  CYL     │          │ Coatings     │
│              │       │ AXIS AXIS    │          │ Accessories  │
└──────────────┘       │ ADD  ADD     │          └──────────────┘
                       │ PD   PD     │
                       │ Prism       │                   │
                       └──────────────┘                  v
                                                Step 4: Payment
                                                ┌──────────────┐
                                                │ Summary      │
                                                │ Discount     │
                                                │ Tax calc     │
                                                │ Pay mode     │
                                                │ Advance      │
                                                │ Delivery date│
                                                └──────────────┘
```

### Desktop: Side-by-side layout
On desktop, Steps 1-2 on the left, Steps 3-4 on the right, all visible simultaneously.

---

## 12. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable, logical tab order |
| Screen reader | Semantic HTML, ARIA labels, live regions for toasts |
| Color contrast | WCAG AA minimum (4.5:1 for text, 3:1 for large text) |
| Reduced motion | Respect `prefers-reduced-motion` |
| Focus indicators | Visible focus ring (2px solid primary-400) |
| Form errors | Associated with inputs via `aria-describedby` |
| Language | `lang="en"` / `lang="hi"` on `<html>` element |
