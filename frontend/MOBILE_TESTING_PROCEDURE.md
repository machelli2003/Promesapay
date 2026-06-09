# Mobile Testing Procedure - Week 2

**Objective:** Verify all frontend improvements work correctly on real mobile devices  
**Time Budget:** 4-6 hours  
**Required Devices:** iPhone + Android (or emulators)

---

## 🚀 Setup (30 minutes)

### 1. Start Development Server
```bash
cd frontend
npm run dev
# Output: VITE v5.1.0  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.X.X:5173
```

### 2. Get Your Computer's IP
```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows (PowerShell)
ipconfig | findstr "IPv4"

# Linux
hostname -I
```

### 3. Test on Your Phone
1. Open browser on phone
2. Navigate to: `http://YOUR_IP:5173` (e.g., http://192.168.1.100:5173)
3. You should see Promesapay homepage

---

## ✅ Mobile Testing Checklist

### Page: Landing Page
**URL:** `/`

**Checklist:**
- [ ] Heading visible (not cut off)
- [ ] Hero image scales properly
- [ ] CTA buttons are full-width and tappable
- [ ] Text is readable (not tiny)
- [ ] No horizontal scrolling
- [ ] Footer is accessible
- [ ] Dark mode works
- [ ] Responsive layout feels right

**Screenshot:** `landing-mobile.png`

---

### Page: Login
**URL:** `/login`

**Checklist:**
- [ ] Form fields are readable
- [ ] Email/password inputs are >44px tall
- [ ] Password visibility toggle works
- [ ] "Forgot password" link is tappable
- [ ] "Sign up" link works
- [ ] Submit button is full-width
- [ ] Error messages display properly
- [ ] Loading spinner shows during login

**Screenshot:** `login-mobile.png`

---

### Page: Register
**URL:** `/register`

**Checklist:**
- [ ] All form fields visible
- [ ] Form validation works on mobile
- [ ] Password strength indicator shows
- [ ] Submit button responsive
- [ ] Link to login page works
- [ ] Error messages clear and readable
- [ ] No layout jank when typing

**Screenshot:** `register-mobile.png`

---

### Page: Dashboard
**URL:** `/dashboard` (login first)

**Checklist:**
- [ ] Dashboard header displays properly
- [ ] Stats cards stack vertically on mobile
- [ ] Stat values are readable (not truncated)
- [ ] Transactions list displays as cards (not table)
- [ ] Each transaction card is tappable
- [ ] Pagination buttons work
- [ ] "Copy profile link" button works
- [ ] "Edit profile" button is accessible
- [ ] Skeleton loaders show while loading

**Screenshot:** `dashboard-mobile.png`

---

### Page: Profile (@username)
**URL:** `/u/testuser` (or any public profile)

**Checklist:**
- [ ] Profile header displays nicely
- [ ] Avatar image loads and scales
- [ ] Stats section is readable
- [ ] Goal progress bar displays properly
- [ ] "Buy a Coffee" button is full-width
- [ ] "Make a Donation" button is full-width
- [ ] Payment modal opens and fits screen
- [ ] Modal can be dismissed
- [ ] Supporter list displays (if any)

**Screenshot:** `profile-mobile.png`

---

### Page: Buy Coffee
**URL:** `/buy-coffee`

**Checklist:**
- [ ] Hero section displays well
- [ ] Coffee tier cards stack vertically
- [ ] Tier cards are easily selectable
- [ ] "Most Popular" badge is visible
- [ ] Price text is readable
- [ ] CTA button on each card is tappable
- [ ] "How it works" section is clear
- [ ] Stats at bottom display well
- [ ] No layout shifts while scrolling

**Screenshot:** `buy-coffee-mobile.png`

---

### Page: Payment Flow
**URL:** Start at `/buy-coffee` or `/u/username`

**Checklist:**
- [ ] Click "Buy Coffee" button
- [ ] Payment modal opens (doesn't go full screen awkwardly)
- [ ] Form fields are visible (amount, name, email)
- [ ] Buttons are tappable
- [ ] Modal has close button (X or outside click)
- [ ] Form validation shows errors clearly
- [ ] Submit button shows loading state
- [ ] Payment redirects properly
- [ ] Success page displays correctly

**Screenshot:** `payment-flow-mobile.png`

---

### Page: Error States
**URL:** Try these manually

**Test Cases:**

**1. 404 Page**
- Navigate to: `/nonexistent-page-12345`
- [ ] Error message displays
- [ ] "Go Home" button works
- [ ] Layout is responsive

**2. Error Boundary**
- Add `throw new Error("Test");` to any page's component
- [ ] Error UI displays
- [ ] Error ID is shown
- [ ] "Try Again" button works
- [ ] "Contact Support" button works
- [ ] Layout looks good

**3. Network Error**
- Disconnect WiFi/4G
- Try to load a page
- [ ] Error message shows
- [ ] Retry button available
- [ ] App doesn't crash

**Screenshot:** `error-states-mobile.png`

---

### Feature: Dark Mode
**Steps:** Toggle dark mode on phone (usually in settings)

**Checklist:**
- [ ] All text is readable in dark mode
- [ ] Backgrounds don't have contrast issues
- [ ] Buttons are visible
- [ ] Form inputs are clear
- [ ] Modal overlays work
- [ ] Icons are visible
- [ ] Loading states look good

**Screenshots:** 
- `dark-mode-landing.png`
- `dark-mode-dashboard.png`
- `dark-mode-profile.png`

---

## 🎥 Recording Issues

When you find a problem, document it:

1. **Take Screenshot**
   - Long press → Screenshot (most phones)
   - Share to computer via email/cloud

2. **Note Details**
   ```
   Issue #1: Buy Coffee buttons not tappable
   - Device: iPhone 12
   - Page: /buy-coffee
   - Breakpoint: 390px width
   - Expected: Buttons should be >= 44px tall
   - Actual: Buttons appear ~30px tall
   - Impact: HIGH - Can't complete purchase
   - Fix: Add py-3 px-4 to button classes
   ```

3. **Create Ticket**
   - Title: "Mobile: [Page] - [Issue]"
   - Description: Include screenshot + steps
   - Priority: HIGH/MEDIUM/LOW
   - Device: iPhone/Android/Both

---

## 📋 Testing Matrix

Print and check as you go:

```
PAGE          | iPhone | Android | Tablet | Notes
─────────────────────────────────────────────────────
Landing       |   ✓   |    ✓    |   ✓   |
Login         |   ✓   |    ✓    |   ✓   |
Register      |   ✓   |    ✓    |   ✓   |
Dashboard     |   ✓   |    ✓    |   ✓   |
Profile       |   ✓   |    ✓    |   ✓   |
Buy Coffee    |   ✓   |    ✓    |   ✓   |
Payment Flow  |   ✓   |    ✓    |   ✓   |
Errors        |   ✓   |    ✓    |   ✓   |
Dark Mode     |   ✓   |    ✓    |   ✓   |
```

---

## 🔧 Quick Fixes Cheat Sheet

### Issue: Text Too Small
```javascript
// Before
<h1 className="text-base">Heading</h1>

// After
<h1 className="text-lg sm:text-xl md:text-2xl">Heading</h1>
```

### Issue: Buttons Not Tappable
```javascript
// Before
<button className="px-2 py-1">Click</button>

// After
<button className="px-4 py-3 sm:py-2">Click</button>
```

### Issue: Modal Overflows
```javascript
// Before
<div className="max-w-md">
  <Modal />
</div>

// After
<div className={isMobile ? "fixed inset-0" : "max-w-md mx-auto"}>
  <Modal />
</div>
```

### Issue: Layout Breaks
```javascript
// Before
<div className="grid grid-cols-3">
  <Card />
</div>

// After
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
  <Card />
</div>
```

---

## 📊 Results Summary

After testing, create a report:

**Testing Completed:** May 30, 2026  
**Tested By:** [Name]  
**Devices Tested:** iPhone 12, Samsung S21, iPad Pro

**Results:**
- [ ] Landing Page: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Login: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Dashboard: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Profile: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Payment Flow: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Dark Mode: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL
- [ ] Error Handling: ✅ PASS / ⚠️ MINOR ISSUES / ❌ FAIL

**Issues Found:** X total
- Critical: 0
- High: 0
- Medium: 0
- Low: 0

**Recommendations:**
1. ...
2. ...
3. ...

---

## 🚀 Performance Quick Check

While testing, observe:

**Page Load Time:**
- Landing page: < 2 seconds
- Dashboard: < 1.5 seconds
- Profile: < 1 second

**Responsiveness:**
- Taps register instantly
- Scrolling is smooth (60fps)
- No lag when typing

**Appearance:**
- Text sharp and readable
- Images load properly
- Colors look good in both light/dark

---

## ✅ Sign-Off

When complete, get team approval:

```
Mobile Testing Completed: YES ✅

All pages tested on real devices:
- [ ] iPhone/iOS
- [ ] Android
- [ ] Tablet

All issues documented:
- [ ] Critical issues fixed
- [ ] High priority issues assigned
- [ ] Low priority issues logged

Team sign-off:
- [ ] Product Manager
- [ ] QA Lead
- [ ] Frontend Lead

Date: _____________
```

---

## 💡 Pro Tips

1. **Use Chrome DevTools:** Remote debugging for complex issues
2. **Test on 4G:** Not just WiFi to catch slow network issues
3. **Try with Hands:** Use actual fingers, not just mouse cursor
4. **Test Landscape:** Rotate phone to landscape mode
5. **Clear Cache:** Between tests to check fresh load
6. **Test Offline:** Disconnect then open app (should show error gracefully)

---

**Estimated Time: 4-6 hours**  
**Target Completion: Friday, May 31, 2026**
