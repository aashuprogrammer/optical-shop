# Feature Audit — Reflex Retail Reference Product

> **Source**: Reflex Retail Offline (`offline.reflexoptics.in`), Google Play listing, official website (`reflexoptics.in`), and provided mobile screenshots.
>
> **Purpose**: Extract the complete functional structure, fields, calculations, and workflows to replicate in OptiSuite.

---

## 1. Navigation & Information Architecture

### 1.1 Desktop (Web App) — Sidebar Navigation

| Position | Menu Item | Sub-items (if expandable) |
|----------|-----------|--------------------------|
| Top | **Home** (Store Hub / Dashboard) | — |
| 2 | **Customers** | — |
| 3 | **Orders** | — |
| 4 | **Products** (My Products) | — |
| 5 | **Purchases** | Bills, Vendors, Ledger, Payments, New Bill |
| 6 | **Eye Tests** | — |
| 7 | **Offers** | Active Offers, Create Offer |
| 8 | **Expenses** | Add Expense, Export Expense |
| 9 | **Membership** | Membership Tiers, Issued Cards, Create Tier |
| Bottom | **Settings** | — |

### 1.2 Mobile App — Bottom Navigation Bar

| Tab | Label |
|-----|-------|
| 1 | Home |
| 2 | Customers |
| 3 | Orders |
| 4 | My Products |

> Additional screens accessible via the Home screen quick-action cards and settings gear icon.

---

## 2. Module-by-Module Breakdown

### 2.1 Home / Dashboard (Store Hub)

#### Top Stats Row (Desktop)
| Widget | Data |
|--------|------|
| Today's Total Orders | Counter (e.g., 0) |
| Total Inventory (qty on hand) | Counter (e.g., 0) |
| Today's Eye Tests | Counter (e.g., 0) |
| Notification Bell | Badge count |
| Zoom/Scale Slider | 50%–150% (desktop only) |

#### Mobile Dashboard Widgets (from screenshots)
| Widget | Data |
|--------|------|
| Today's Sales | ₹ amount with % change indicator |
| Total Orders | Count with % change |
| Active Customers | Count with % change |
| Pending Orders | Count with % change |

#### Today's Notifications Section (Mobile)
- Carousel of notification cards (e.g., "Order due for delivery today 1/2")
- Swipeable

#### New Order — Quick Action Cards
| Card | Label | Description |
|------|-------|-------------|
| 1 | **Spectacles** | Prescription & frames |
| 2 | **Contact Lenses** | Lenses & follow-ups |
| 3 | **Accessories** | Cases, solutions & more |
| 4 | **Repairs** | Frame & lens service |
| 5 | **Eye Test** | Refraction & prescription |
| 6 | **Dashboard** | (Mobile only) Full analytics dashboard |

#### Store & Tools Section (Desktop)
- Eye chart/glasses icon card
- Notification/Bell icon card
- Grid/Layout icon card
- Analytics/Bar-chart icon card
- Line-chart/Growth icon card

#### Revenue Chart (Mobile Dashboard)
- Bar chart with daily revenue (Mon–Sun)
- Toggle: This Week / This Month / Custom range
- Shows individual day amounts

#### Orders Due Section (Mobile)
- Date display (e.g., "2025-07-30")
- List of orders due for delivery

---

### 2.2 Customer / Patient Management

#### Customer List Screen

**Header Stats Badges:**
| Badge | Meaning |
|-------|---------|
| In book | Total customers count |
| Showing | Currently filtered count |
| New (7d) | Customers added in last 7 days |

**Search & Filter Bar:**
| Control | Type | Placeholder/Options |
|---------|------|---------------------|
| Search | Text input | "Search by name, phone, city, address, pin..." |
| Sort by | Dropdown | Name A-Z, Name Z-A, Newest first, Oldest first |
| Filter | Dropdown | All contacts, With dues, Without dues |
| City | Dropdown | All cities, [dynamic city list] |
| Reset filters | Button | Clears all filters |

**View Toggle:** Grid view / List view

#### Customer Detail Panel (Split View)

**Header:**
- Customer name
- Phone number (or "No phone on file")
- Close (X) button
- "Full profile" button

**Metric Widgets:**
| Metric | Example |
|--------|---------|
| Active jobs | 0 |
| Avg. retail | -- or ₹ amount |
| Eye tests | 0 |
| Invoices | 0 |

**History Section:**
- "History (newest first)"
- Lists: orders, eye tests, payments chronologically
- Empty state: "No jobs yet for this customer."

#### Customer Creation / Full Profile Form

| Field | Type | Notes |
|-------|------|-------|
| First name | Text | Required |
| Last name | Text | Optional |
| Phone | Text/Tel | Primary identifier |
| Email | Text | Optional |
| Date of birth | Date | Optional |
| Gender | Dropdown | Male / Female / Other |
| Address line 1 | Text | |
| Address line 2 | Text | |
| City | Text | |
| State | Text | |
| PIN code | Text | |
| Profile image | File upload | Stored in R2 |
| Notes | Textarea | Free-text |
| Membership | Dropdown | Link to membership tier |

**FAB:** "+ Add customer" (green, bottom-right)

---

### 2.3 Orders / Billing / POS

#### Order List Screen

**Header:** "Orders" with counter

**Search & Filter:**
| Control | Type | Options |
|---------|------|---------|
| Search | Text | "Search order, customer, phone..." |
| Status tabs | Tab bar | All, Pending, Processing, Ready, Delivered, Cancelled |

**Order List Columns:**
| Column | Data |
|--------|------|
| Order ID | e.g., ORD-7 |
| Customer name | |
| Created date/time | e.g., "29 Jul 2025, 12:43 PM" |
| Status badge | Pending / Processing / Ready / Delivered / Cancelled |
| Total amount | ₹ |

#### Order Detail View

**Order Progress Stepper (from mobile screenshot):**
```
Pending → Processing → Ready → Delivered
```
- Visual: Circles connected by lines, filled/checked = complete
- Expected Delivery date shown below

**Order Details Section:**
| Field | Example |
|-------|---------|
| Order ID | ORD-7 |
| Created | 29 Jul 2025, 12:43 PM |
| Status | Pending (editable) |
| Expected Delivery | 31 Jul 2025 |
| Order type | Spectacles / Contact Lens / Accessories / Repair |

**Line Items:**
| Field | Example |
|-------|---------|
| Product name | "bnl - Normal (Monthly)" |
| Category | Contact Lens / Frame / Lens / Accessories |
| Unit price | Rs.600.00 |
| Quantity | 2 |
| Total | Rs.1200.00 |

**Prescription Details (per order, when applicable):**
| Eye | SPH | CYL | AXIS | ADD |
|-----|-----|-----|------|-----|
| Right | -4.75 | - | - | - |
| Left | -2.0 | - | - | - |

**Payment Summary:**
| Field | Value |
|-------|-------|
| Subtotal | Rs.1200.00 |
| Discount | Rs.0.00 |
| Tax (GST) | Rs.X.XX |
| Total | Rs.1200.00 |
| Advance paid | Rs.X.XX |
| Balance due | Rs.X.XX |
| Payment mode | Cash / Card / UPI / Split |

#### Order Creation Form (Spectacles — Primary Flow)

**Step 1 — Customer Selection:**
| Field | Type |
|-------|------|
| Search/select customer | Autocomplete |
| Or create new customer | Button → mini form |

**Step 2 — Prescription:**
| Field | Type | Per-Eye |
|-------|------|---------|
| SPH (Sphere) | Number (±0.25 steps) | R.E / L.E |
| CYL (Cylinder) | Number (±0.25 steps) | R.E / L.E |
| AXIS | Number (1–180) | R.E / L.E |
| ADD (Addition) | Number (±0.25 steps) | R.E / L.E |
| PD (Pupillary Distance) | Number | R.E / L.E (or monocular) |
| Prism | Number | R.E / L.E |
| Prism base | Dropdown (Up/Down/In/Out) | R.E / L.E |
| Visual Acuity | Text | R.E / L.E |

**Step 3 — Product Selection:**
| Field | Type |
|-------|------|
| Frame | Search/select from inventory |
| Lens type | Dropdown (Single Vision, Bifocal, Progressive, etc.) |
| Lens material | Dropdown |
| Lens coating | Multi-select (Anti-reflective, Blue-cut, Photochromic, etc.) |
| Tint | Dropdown |
| Additional items | Add more line items |

**Step 4 — Pricing & Payment:**
| Field | Type |
|-------|------|
| Line item prices | Auto-filled from catalog, editable |
| Discount type | Toggle: Flat ₹ / Percentage % |
| Discount amount | Number |
| GST/Tax | Auto-calculated |
| Total | Auto-calculated |
| Advance payment | Number |
| Payment mode | Dropdown: Cash, Card, UPI, Split |
| Split details | If split: amount per mode |
| Balance due | Auto-calculated |
| Expected delivery | Date picker |
| Notes | Textarea |

**Step 5 — Confirmation & Save**

#### Order Creation — Contact Lenses
Similar to Spectacles but:
- Adds: Base Curve (BC), Diameter (DIA), Brand, Replacement schedule (Daily/Weekly/Monthly/Yearly)
- No frame selection
- Contact lens power may differ from spectacle Rx (vertex distance conversion)

#### Order Creation — Accessories
- Simpler: no prescription
- Product selection from accessories category
- Standard pricing/payment

#### Order Creation — Repair & Services
- Service type dropdown (Frame repair, Lens replacement, Nose pad, Screw, Adjustment, etc.)
- Description text
- Estimated cost
- No inventory deduction (service-based)

---

### 2.4 Eye Test / Prescription Module

#### Eye Test List Screen

**Search & Filters:**
| Control | Type |
|---------|------|
| Search | "Search test number, name, or phone" |
| Date From | Date picker |
| Date To | Date picker |

**Stats:** "X shown" counter

#### Eye Test Form (from mobile screenshot)

**Patient Info:**
- Customer name (auto-filled or selected)
- Phone number
- "Eye Test" badge

**Prescription Section:**
| Field | R.E (Right Eye) | L.E (Left Eye) |
|-------|-----------------|-----------------|
| SPH | Number (e.g., 0.00) | Number |
| CYL | Number | Number |
| AXIS | Number (0-180) | Number |
| ADD | Number | Number |

**PD & Prism Section:**
| Field | Right Eye | Left Eye |
|-------|-----------|----------|
| PD | Number (e.g., 32.5) | Number (e.g., 32.5) |
| Prism Direction | Dropdown (Up/Down/In/Out) | Dropdown |
| Prism Value | Number (e.g., 0.5) | Number |

**Visual Acuity Section:**
| Field | Right Eye | Left Eye |
|-------|-----------|----------|
| Visual Acuity | Text/Number | Text/Number |

**Action Button:** "COMPLETE EYE TEST"

#### Lens Power Tools (Auto-Transpose)

**Plus-to-Minus Cylinder Transposition Formula:**
1. New SPH = Old SPH + Old CYL
2. New CYL = -(Old CYL)  (sign flip)
3. New AXIS = Old AXIS ± 90 (add 90 if <=90, subtract 90 if >90)

**Spectacle-to-Contact Lens Power Conversion:**
```
Fc = Fs / (1 - d * Fs)
```
Where:
- Fc = Contact lens power
- Fs = Spectacle lens power (sphere or meridional)
- d = Vertex distance in meters (default 0.012 = 12mm)

**Spherical Equivalent:**
```
SE = SPH + (CYL / 2)
```

---

### 2.5 Products / Inventory

#### Product List Screen

**Header:** "My Products"

**Add Product Button:** "+ Add" (dropdown with options)

**Search & Filters:**
| Control | Type | Options |
|---------|------|---------|
| Search | Text | "Search name, code, type, price, stock..." |
| Type filter | Tab buttons | All, Frames, Lenses, Contact, Accessories |
| Stock filter | Dropdown | Any stock, In stock, Out of stock, Low stock |
| Sort | Dropdown | "Type, then name", Name A-Z, Price low-high, Price high-low, Stock low-high |

**Product List Columns:**
| Column | Data |
|--------|------|
| Product name | |
| Product code/SKU | |
| Type/Category | Frame / Lens / Contact / Accessories |
| Brand | |
| Price | ₹ |
| Stock qty | Number |
| Status | Active / Inactive |

**Product Detail Panel:**
- Name, code, type, brand
- Purchase price, selling price, MRP
- HSN code, GST rate
- Current stock
- Barcode/QR

#### Product Creation Form

**Common Fields:**
| Field | Type |
|-------|------|
| Product name | Text |
| Product code / SKU | Text (auto-generated or manual) |
| Category | Dropdown: Frame, Lens, Contact Lens, Accessories, Solution |
| Brand | Text / Dropdown |
| Model / Variant | Text |
| Color | Text |
| Size | Text |
| Purchase price | Number |
| Selling price (MRP) | Number |
| HSN code | Text |
| GST rate | Dropdown: 0%, 5%, 12%, 18%, 28% |
| Opening stock | Number |
| Minimum stock level | Number (for low-stock alert) |
| Barcode | Text (scannable) |
| Product image | File upload |
| Description | Textarea |
| Status | Toggle: Active / Inactive |

**Frame-specific Fields:**
| Field | Type |
|-------|------|
| Frame type | Dropdown: Full-rim, Half-rim, Rimless |
| Frame material | Dropdown: Metal, Plastic, Titanium, etc. |
| Frame shape | Dropdown: Rectangular, Round, Aviator, Cat-eye, etc. |
| Temple length | Number |
| Bridge width | Number |
| Lens width | Number |
| Gender | Dropdown: Male, Female, Unisex, Kids |

**Contact Lens-specific Fields:**
| Field | Type |
|-------|------|
| Replacement schedule | Dropdown: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Yearly |
| Base curve (BC) | Number |
| Diameter (DIA) | Number |
| Water content | Text |
| Material | Text |

---

### 2.6 Purchases & Vendors

#### Sub-navigation (within Purchases)
| Item | Description |
|------|-------------|
| Bills | List of purchase bills from vendors |
| Vendors | Supplier directory |
| Ledger | Financial ledger for vendor accounts |
| Payments | Payment records to vendors |
| New Bill | Create a new purchase bill |

#### Purchase Bills Screen

**Search:** "Search vendor, bill, product, status"

**Status Tabs:** All, Pending, Partial, Paid, Cancelled

**Bill Fields:**
| Field | Type |
|-------|------|
| Bill number | Text |
| Vendor | Dropdown/Search |
| Bill date | Date |
| Due date | Date |
| Items | Line items (product, qty, rate, amount) |
| Subtotal | Auto-calculated |
| Tax | Auto-calculated |
| Total | Auto-calculated |
| Amount paid | Number |
| Balance | Auto-calculated |
| Status | Pending / Partial / Paid / Cancelled |
| Notes | Textarea |

#### Vendor Fields
| Field | Type |
|-------|------|
| Vendor name | Text |
| Contact person | Text |
| Phone | Text |
| Email | Text |
| GSTIN | Text |
| Address | Text |
| City | Text |
| State | Text |
| PIN | Text |
| Notes | Textarea |

---

### 2.7 Offers & Promotions

#### Overview Widgets
| Widget | Data |
|--------|------|
| Total offers | Count |
| Active | Count |
| Orders with offers | Count |
| Total savings | ₹ amount |

#### Offer Tabs: Active, All Offers, Expired

#### Offer Creation Form
| Field | Type |
|-------|------|
| Offer name | Text |
| Description | Textarea |
| Discount type | Dropdown: Flat ₹, Percentage % |
| Discount value | Number |
| Applicable to | Multi-select: All, Frames, Lenses, Contact, Accessories |
| Minimum order amount | Number |
| Start date | Date |
| End date | Date |
| Usage limit | Number (total) |
| Per-customer limit | Number |
| Coupon code | Text (optional) |
| Status | Active / Inactive |

---

### 2.8 Expenses

#### Overview Widgets
| Widget | Data |
|--------|------|
| TOTAL | Rs X.XX |
| ONE-TIME | Rs X.XX |
| RECURRING | Rs X.XX |
| PURCHASES | Rs X.XX |

#### Date Quick Filters: Today, Last 30 days, This month, Custom range

#### Tabs: All, Recurring, Purchases

#### Expense Fields
| Field | Type |
|-------|------|
| Title / Description | Text |
| Category | Dropdown: Rent, Utilities, Salary, Marketing, Supplies, Maintenance, Other |
| Amount | Number |
| Date | Date |
| Payment mode | Dropdown: Cash, Card, UPI, Bank Transfer |
| Type | Radio: One-time / Recurring |
| Recurrence | Dropdown: Daily, Weekly, Monthly, Yearly (if recurring) |
| Notes | Textarea |
| Attachment/Receipt | File upload |

---

### 2.9 Membership / Loyalty

#### Overview Widgets
| Widget | Data |
|--------|------|
| Issued | Count |
| Active | Count |
| Expired | Count |
| Points liability | Count |

#### Tabs: Tiers, Issued Cards

#### Tier Examples (from app)
| Tier | Description | Joining Fee | Validity |
|------|-------------|-------------|----------|
| Gold | Premium membership with exclusive benefits | ₹500 | 12 months |
| VIP | VIP membership with maximum benefits | ₹1000 | 24 months |
| Premium | Premium membership with enhanced benefits | ₹300 | 12 months |

#### Membership Tier Fields
| Field | Type |
|-------|------|
| Tier name | Text |
| Description | Textarea |
| Joining fee | Number |
| Validity (months) | Number |
| Discount percentage | Number |
| Points per ₹100 spent | Number |
| Minimum spend for eligibility | Number |
| Benefits description | Textarea |
| Status | Active / Inactive |

#### Issued Card Fields
| Field | Type |
|-------|------|
| Card number | Auto-generated |
| Customer | FK to customer |
| Tier | FK to tier |
| Issue date | Date |
| Expiry date | Date (auto-calculated from validity) |
| Points balance | Number |
| Status | Active / Expired / Cancelled |

---

### 2.10 WhatsApp / Marketing Campaigns (from mobile screenshot)

#### Create WhatsApp Campaign Screen
| Field | Type |
|-------|------|
| Campaign name | Text (optional) |
| Message | Textarea ("Enter your message...") |
| Attach Image | File picker (optional) |
| Message Templates | Selectable templates |

#### Pre-built Templates
| Template Name | Preview Text |
|---------------|-------------|
| Welcome & Visit | "Hello [Customer Name], check out our latest products at Demo Optical. Visit soon!" |
| Special Offers | [promotional template] |
| Follow-up | [follow-up template] |
| Eye Check Reminder | [reminder template] |

#### Campaign Targets
- All customers
- Filtered by: city, last visit date, membership tier, outstanding dues

---

### 2.11 Reports & Analytics (Dashboard Module)

#### Business Dashboard (from mobile screenshot)

**Dashboard Overview Header:** "Track your optical business performance"

**KPI Cards:**
| Metric | Data | Change Indicator |
|--------|------|-----------------|
| Today's Sales | ₹ amount | % change (green/red) |
| Total Orders | Count | % change |
| Active Customers | Count | % change |
| Pending Orders | Count | % change |

**Revenue Chart:**
- Bar chart (daily breakdown)
- Toggle: This Week / This Month / This Year
- Shows ₹ amounts per day

**Expected Additional Reports:**
| Report | Description |
|--------|-------------|
| Daily sales summary | Total sales, orders, payments by day |
| Monthly sales report | Aggregated monthly data |
| GST report | CGST/SGST/IGST breakdowns |
| Outstanding/Dues report | Customers with pending balances |
| Top-selling products | Most sold items by category |
| Stock valuation | Total inventory value at cost/retail |
| Low-stock report | Items below minimum threshold |
| Staff performance | Sales by staff member |
| Customer acquisition | New vs. returning customers |
| Payment mode breakdown | Cash vs. Card vs. UPI distribution |
| Eye test report | Tests performed per period |
| Expense report | Categorized expense summaries |

---

### 2.12 Settings

**Expected Settings Sections:**
| Section | Fields |
|---------|--------|
| Shop Profile | Shop name, address, phone, email, GSTIN, logo, operating hours |
| Tax/GST Config | Default tax rates, HSN codes, tax registration details |
| Invoice Settings | Invoice prefix, starting number, terms & conditions, footer text |
| User Management | Staff accounts, roles, permissions |
| Notification Settings | WhatsApp integration, SMS settings |
| Language | English / Hindi toggle |
| Data Management | Import/Export, backup |
| About | Version, support contact |

---

## 3. Calculations & Business Logic

### 3.1 Bill/Invoice Calculations

```
Line Item Total = Unit Price * Quantity
Subtotal = SUM(Line Item Totals)
Discount Amount = Subtotal * (Discount% / 100)  OR  Flat discount
Taxable Amount = Subtotal - Discount Amount
GST Amount = Taxable Amount * (GST Rate / 100)
  -> CGST = GST Amount / 2
  -> SGST = GST Amount / 2
  -> (or IGST = GST Amount for inter-state)
Grand Total = Taxable Amount + GST Amount
Balance Due = Grand Total - Advance Paid
```

### 3.2 Stock Calculations

```
Current Stock = Opening Stock + Purchase In - Sales Out - Adjustments
Stock Value (at cost) = SUM(Current Stock * Purchase Price) per product
Stock Value (at retail) = SUM(Current Stock * Selling Price) per product
Low Stock Alert: triggered when Current Stock < Minimum Stock Level
```

### 3.3 Optical Calculations

**Auto-Transpose (Plus <-> Minus Cylinder):**
```
New SPH = Old SPH + Old CYL
New CYL = -(Old CYL)
New AXIS = (Old AXIS + 90) mod 180  [if result = 0, use 180]
```

**Spectacle to Contact Lens Power:**
```
Fc = Fs / (1 - d * Fs)
where d = 0.012 (12mm vertex distance, adjustable)
Applied to each meridian separately for toric lenses
```

**Spherical Equivalent:**
```
SE = SPH + (CYL / 2)
```

### 3.4 Membership Points
```
Points Earned = floor(Order Total / 100) * Points per 100
Points Redeemed = manual entry (capped at balance)
Points Balance = Previous Balance + Earned - Redeemed
```

---

## 4. Workflows & State Transitions

### 4.1 Order Lifecycle
```
Created -> Pending -> Processing -> Ready -> Delivered
                |                             |
                +-----> Cancelled <-----------+
```

### 4.2 Payment Status
```
Pending (no payment) -> Partial (advance paid) -> Paid (full amount received)
```

### 4.3 Purchase Bill Status
```
Pending -> Partial -> Paid -> (Cancelled at any stage)
```

### 4.4 Eye Test Flow
```
Select/Create Customer -> Enter Prescription -> Save Eye Test -> Link to Order (optional)
```

---

## 5. Features Explicitly EXCLUDED from OptiSuite

| Feature | Reason |
|---------|--------|
| Buy/Upgrade Plan / Subscription purchase | Self-hosted; no SaaS billing |
| Self-signup / Tenant provisioning | Accounts created manually in DB |
| Offline-first sync engine | Not required for initial version |
| WhatsApp API integration | Can be added later; not core |
| Barcode scanner hardware integration | Can be added later |
| Multi-branch/multi-location | Single shop initially |
| Data import wizard (from Tally/Excel) | Not needed initially |

---

## 6. Summary — Module Count

| # | Module | Screens |
|---|--------|---------|
| 1 | Auth (Login) | 1 |
| 2 | Dashboard / Home | 1 |
| 3 | Customers | 2 (List + Detail/Profile) |
| 4 | Orders / Billing | 3 (List + Detail + Create) |
| 5 | Products / Inventory | 2 (List + Create/Edit) |
| 6 | Purchases & Vendors | 5 (Bills, Vendors, Ledger, Payments, New Bill) |
| 7 | Eye Tests | 2 (List + Create/Detail) |
| 8 | Offers & Promotions | 2 (List + Create) |
| 9 | Expenses | 2 (List + Create) |
| 10 | Membership & Loyalty | 3 (Tiers, Cards, Create Tier) |
| 11 | Reports & Dashboard | 1 (with sub-reports) |
| 12 | Settings | 1 (multi-section) |
| 13 | Chatbot / Help Widget | 1 (overlay) |
| **Total** | | **~26 screens** |
