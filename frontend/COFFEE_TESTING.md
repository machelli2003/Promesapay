# Buy Me A Coffee - End-to-End Testing Guide

## Feature Checklist

### ✅ Backend Components
- [x] Coffee route endpoints (`/coffee/initiate`, `/coffee/verify`, `/coffee/recent`, `/coffee/stats`)
- [x] Coffee model and database collection
- [x] Paystack integration (initialize_payment, verify_payment)
- [x] Stats aggregation for coffee metrics
- [x] Profile route updated with coffee stats

### ✅ Frontend Components  
- [x] CoffeeBox component with tiers ($3/$6/$9 + Custom)
- [x] DonateBox component with amounts ($5/$10/$25/$50/$100 + Custom)
- [x] PaymentModal refactored to inline styles
- [x] api/coffee.js with all methods
- [x] Dashboard displays coffee stats

### ✅ UI/UX Polish
- [x] Consistent DM Sans/DM Serif Display typography
- [x] Inline styles throughout
- [x] CSS custom properties for theming
- [x] Dark mode support
- [x] Character counter on coffee messages (150 max)
- [x] Hover effects and transitions

## Test Scenarios

### Scenario 1: Coffee Purchase (Logged Out)
1. Navigate to user profile (e.g., `/@username`)
2. View ProfilePage with Coffee and Donation sections
3. Click "Send Coffee" with $3 tier
4. PaymentModal opens showing:
   - ☕ Coffee icon
   - Amount: GH₵15 (3 cups × GH₵5)
   - Email field for receipt
5. Enter email: `test@example.com`
6. Click "Pay GH₵15 via Paystack"
7. Redirected to Paystack checkout
8. Use test card: `4111 1111 1111 1111` (or test account)
9. Complete payment
10. Paystack redirects back with reference
11. Backend processes webhook
12. Coffee record saved with status: "success"
13. Recipient sees new supporter in their profile

### Scenario 2: Coffee with Personal Message
1. Same as Scenario 1 but:
2. Add message: "Love your content!"
3. Character counter shows: "13/150"
4. Proceed with payment
5. Message displays in supporters list

### Scenario 3: Custom Coffee Amount
1. Click "Custom" in Coffee section
2. Input field appears
3. Enter amount: `25` (GH₵)
4. Button updates: "Send Custom Coffee"
5. PaymentModal shows: GH₵25
6. Complete payment flow

### Scenario 4: Donation Purchase
1. Same flow as coffee but:
2. No message field (donations are anonymous)
3. Amounts: $5/$10/$25/$50/$100
4. Type sent: "donation" not "coffee"

### Scenario 5: Dashboard Stats Update
1. After completing coffee purchase (#1)
2. Dashboard shows:
   - **Coffee Tips**: GH₵15
   - **Coffees**: 1 in stats line
   - Transaction history includes coffee entry
3. Stats update via `/profile/me/stats` endpoint

### Scenario 6: Profile Stats Page
1. User views own profile
2. Supporters section shows:
   - Donor name (from coffee)
   - Amount paid (GH₵15)
   - Time ago ("2 minutes ago")
   - Optional message (if coffee)
3. Statistics show aggregated totals

### Scenario 7: API Endpoints Verification
```bash
# Initiate coffee
curl -X POST http://localhost:5000/api/coffee/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_username": "john",
    "cups": 3,
    "donor_name": "Jane",
    "donor_email": "jane@example.com",
    "message": "Great work!"
  }'

# Verify payment
curl -X POST http://localhost:5000/api/coffee/verify \
  -H "Content-Type: application/json" \
  -d '{"reference": "cof_abc123"}'

# Get recent coffees (with JWT token)
curl -X GET http://localhost:5000/api/coffee/recent?page=1 \
  -H "Authorization: Bearer <TOKEN>"

# Get stats
curl -X GET http://localhost:5000/api/coffee/stats \
  -H "Authorization: Bearer <TOKEN>"
```

## Debugging Checklist

### If Payment Modal Doesn't Open
- [ ] Verify ProfilePage imports PaymentModal
- [ ] Check browser console for JS errors
- [ ] Verify modal state is set correctly in CoffeeBox.onBuy
- [ ] Check z-index in PaymentModal styles

### If Payment Fails
- [ ] Verify Paystack API keys in backend
- [ ] Check PAYSTACK_PUBLIC_KEY in frontend env
- [ ] Verify webhook endpoint is accessible
- [ ] Check backend logs for payment errors
- [ ] Verify internet connection for Paystack calls

### If Stats Don't Update
- [ ] Verify coffee collection has "success" status
- [ ] Check `/profile/me/stats` response includes coffee fields
- [ ] Verify Dashboard fetches stats after payment
- [ ] Check Database query in profile.py for coffee aggregation

### If Message Not Saving
- [ ] Check message length (max 150 chars)
- [ ] Verify character counter is accurate
- [ ] Check API payload includes `message` field
- [ ] Verify coffee collection schema includes message field

## Success Criteria

- [x] CoffeeBox and DonateBox render correctly
- [x] PaymentModal opens on button click
- [x] Email validation works
- [x] Character counter on messages works
- [x] Paystack integration receives correct payload
- [x] Coffee records created in database
- [x] Stats update on Dashboard after payment
- [x] Supporter list shows donors
- [x] Dark mode works throughout
- [x] Mobile responsive design works

## Performance Targets

- Modal open: <100ms
- Stats fetch: <200ms
- Payment initiation: <500ms
- Message counter: instant
- Responsive layout: works at 320px+ width
