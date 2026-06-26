# Quick Start Guide: Payment Management System

## For Users

### Adding a Payment Method
1. Go to Profile/Settings or Dashboard
2. Navigate to "Payment Methods"
3. Click "Add Method"
4. Fill in details based on method type:
   - **Bank Transfer**: Bank name, account number, account name, bank code
   - **Mobile Money**: Phone number, provider
   - **PayPal**: Email address
   - **Crypto**: Wallet address, currency

5. Submit for approval
6. Status shows: **⏳ Pending Approval** (yellow badge)
7. Wait for admin approval

### Requesting a Withdrawal
1. Go to **Wallet** page
2. Verify you have an **approved** payment method
3. Click "Request Withdrawal"
4. Enter:
   - Amount (minimum GHC 50)
   - Select approved payment method
   - Optional: Reason for withdrawal

5. Submit request
6. Status: **Pending** (yellow)
7. Wait for admin review

### Checking Withdrawal Status
- **Pending**: Admin hasn't reviewed yet
- **Approved**: Admin approved, funds being sent
- **Completed**: Funds have been sent ✓
- **Rejected**: Admin rejected (reason shown)

---

## For Admins

### Dashboard Access
**URL**: `/admin/payments`

### Tab 1: Financial Overview 📊
- **See**: Total donations, withdrawals, allocations, platform balance
- **Use**: Monitor financial health of platform
- **Updates**: Every 30 seconds automatically

### Tab 2: Payment Methods 💳

#### Review Pending Approvals
1. Filter shows all payment methods by status
2. Review user details and account info
3. Either **Approve** or **Reject**:
   - **Approve**: Payment method ready for use
   - **Reject**: Enter reason (sent to user)

#### Action Buttons
- **✓ Approve**: User can immediately use for withdrawals
- **✗ Reject**: Requires reason, notifies user

### Tab 3: Withdrawals 💰

#### Process Pending Withdrawals
1. See all pending requests
2. For each withdrawal:
   - Review user, amount, reason
   - Decide to **Approve** or **Reject**

#### Approval Steps
1. **Approve** → Status: "approved"
2. Manually send funds to payment method (via Paystack, bank transfer, etc.)
3. **Mark as Completed** → Enter optional transaction ID
4. User notified automatically

#### Rejection Steps
1. Click **Reject**
2. Enter reason (explain why rejected)
3. Funds remain in user's wallet
4. User can resubmit later

### Tab 4: Fund Allocation ➕

#### Allocate Funds to User
1. Enter **User ID** or **Email**
2. Enter **Amount** (GHC)
3. Enter **Reason** (e.g., "Promotional bonus", "Refund", "Correction")
4. Click "Allocate Funds"

#### Results
- ✓ Funds credited immediately
- ✓ User notified
- ✓ Transaction record created
- ✓ Visible in allocation history

#### Allocation History
- Search by user email/name
- See all allocations made
- View amounts and reasons
- Date tracking

---

## User Withdrawal Workflow (Step by Step)

### Step 1: Add Payment Method (First Time)
```
User → Dashboard → Payment Methods → Add Method
      → Fill details → Submit
      → Status: ⏳ Pending Approval
```

### Step 2: Admin Reviews
```
Admin → /admin/payments → Payment Methods tab
     → See "Pending Approval"
     → Click ✓ Approve (or ✗ Reject with reason)
```

### Step 3: User Gets Notification
```
User receives notification: "Payment method approved!"
User can now use this method for withdrawals
```

### Step 4: User Requests Withdrawal
```
User → Wallet → Request Withdrawal
   → Enter: Amount (min 50), Payment method, Reason
   → Click "Request Withdrawal"
   → Status: Pending
```

### Step 5: Admin Reviews Withdrawal
```
Admin → /admin/payments → Withdrawals tab
    → See pending request with user info
    → Click ✓ Approve (or ✗ Reject with reason)
```

### Step 6: Admin Sends Funds
```
Admin manually sends funds via:
- Bank transfer
- Paystack API
- Mobile Money
- Or other provider
```

### Step 7: Admin Marks Complete
```
Admin → Withdrawals tab → Approved withdrawals
    → Click "Mark as Completed"
    → Optionally enter transaction ID
    → Status: Completed ✓
    → User notified
```

### Step 8: User Receives Payment ✓

---

## Admin Fund Allocation (Direct Method)

### When to Use Allocate Funds
- Promotional bonuses
- Refunds/Corrections
- Compensation
- Admin decisions
- Testing

### How to Allocate

1. Go to **Fund Allocation** tab
2. Enter user ID or email
3. Enter amount
4. Enter reason (required for audit trail)
5. Click "Allocate Funds"
6. Funds appear in user's wallet immediately
7. User can withdraw as normal

### Example:
```
User: john@example.com
Amount: 100 GHC
Reason: "Promotional welcome bonus - February campaign"
Result: User balance increased by 100 GHC
```

---

## Status Badges & Colors

### Payment Methods
- 🟡 **Pending Approval** (Yellow) - Waiting for admin review
- 🟢 **Approved** (Green) - Ready to use for withdrawals
- 🔴 **Rejected** (Red) - Rejected, reason shown

### Withdrawals
- 🟡 **Pending** (Yellow) - Awaiting admin approval
- 🔵 **Approved** (Blue) - Approved, funds being sent
- 🟢 **Completed** (Green) - Funds sent successfully ✓
- 🔴 **Rejected** (Red) - Rejected, reason shown

---

## Key Points to Remember

✅ Users MUST have an approved payment method before withdrawal
✅ Minimum withdrawal: 50 GHC
✅ Admin must approve BOTH payment method AND withdrawal
✅ Always provide reason when rejecting (for user transparency)
✅ Financial overview updates automatically every 30 seconds
✅ All transactions are recorded for audit trail
✅ Users get notifications for all status changes
✅ Admin can directly allocate funds without withdrawal request
✅ Editing payment method details resets approval status
✅ Users can cancel pending withdrawals anytime

---

## Troubleshooting

### User can't see withdrawal button?
- Check: Does user have an approved payment method?
- If not: User must add and get approval first

### Payment method stuck on "Pending Approval"?
- Admin hasn't reviewed yet (check /admin/payments)
- Resubmit if it was rejected (details reset status)

### Where do I see all financial data?
- Go to **Financial Overview** tab on /admin/payments
- Shows comprehensive platform statistics
- Updates every 30 seconds

### How to undo a fund allocation?
- Currently: Fund allocations are permanent
- Future: Add reversal/correction mechanism

---

**Questions? Check the IMPLEMENTATION_SUMMARY.md for full technical details**
