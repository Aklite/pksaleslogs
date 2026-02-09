
# Super-Fast Sales Workflow Upgrade

This plan enhances your daily sales entry speed and dashboard intelligence with 5 major upgrades.

---

## What You Will Get

### 1. Super-Fast Entry Form
- **Smart Customer Search**: As you type a customer name, matching contacts appear instantly (replaces the current dropdown with a searchable input)
- **Saree Type Quick-Select**: A row of gold tap-buttons -- Silk, Cotton, Banarasi, Fancy, Designer -- so you never type the category
- **Live Auto-Total**: The total updates in real-time as you enter price and quantity, shown in large bold text (already works, will be more prominent)

### 2. Dashboard Upgrades
- **"Today: X Sarees" Counter**: A prominent counter at the top showing how many sarees sold today
- **Today's Bills List**: A scrollable list of today's sales with customer name, amount, and a quick Delete button for fixing rush-hour mistakes
- **Monthly Commission Card**: A new Bento card showing your total commission earnings this month

### 3. Commission and Payment Tracking
- **Incentive Field**: New "Incentive %" or "Fixed Commission" field in the sale form; your earnings are auto-calculated per sale
- **Payment Mode Toggle**: Cash / UPI / Card selector on every sale so you can reconcile at end of day
- Both fields stored in the database for reporting

### 4. WhatsApp Thank-You Pop-up
- After saving a new sale, a pop-up appears: "Send a Thank You on WhatsApp?"
- Tapping "Yes" opens WhatsApp with a pre-written message: "Thank you for shopping with us! Hope you love your new saree."
- Only shows for sales linked to a customer with a phone number

### 5. Floating Action Button (FAB)
- A large gold "+" button fixed in the bottom-right corner (above the navigation bar) on the Sales Log page
- Always under your thumb for instant access
- Replaces the small "New Sale" button in the header

---

## Technical Details

### Database Migration
Add 3 new columns to the `sales` table:

```text
sales table changes:
+-------------------+----------+------------------+
| Column            | Type     | Default          |
+-------------------+----------+------------------+
| saree_type        | text     | NULL (optional)  |
| payment_mode      | text     | 'cash'           |
| commission        | numeric  | 0                |
+-------------------+----------+------------------+
```

### Files to Modify

**`src/pages/SalesLog.tsx`** (major changes):
- Replace `Select` dropdown with a searchable text input that filters customers as you type
- Add saree type quick-select buttons (Silk, Cotton, Banarasi, Fancy, Designer)
- Add payment mode toggle (Cash / UPI / Card)
- Add commission/incentive field with auto-calculation
- Add floating action button (FAB) at bottom-right
- After successful save, show a WhatsApp thank-you dialog if customer has a phone number

**`src/pages/Dashboard.tsx`** (moderate changes):
- Fetch today's saree count (sum of quantity) and today's sales list
- Add "Today: X Sarees" counter at the top
- Add a "Monthly Commission" Bento card
- Add "Today's Bills" section with delete capability
- Add "Peak Performance" bar chart showing best day of the week

**`src/components/BentoCard.tsx`** -- no changes needed, reuse existing component

**`src/components/Layout.tsx`** -- no changes needed

### No Breaking Changes
- All new database columns have defaults, so existing sales data remains intact
- The current form fields (price, quantity, tips) stay exactly where they are
- New fields (saree type, payment mode, commission) are optional additions
