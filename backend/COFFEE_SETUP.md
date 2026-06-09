# Buy Me A Coffee Setup Guide

## Overview
The Buy Me A Coffee feature allows supporters to send small monetary gifts ($3, $6, $9) or custom amounts to creators, with optional personal messages.

## Database Schema

### Coffee Collection
```javascript
{
  _id: ObjectId,
  recipient_id: String,           // Creator's user ID
  buyer_id: String,               // Supporter's user ID (if logged in)
  donor_name: String,             // Supporter's display name
  donor_email: String,            // Supporter's email
  amount: Number,                 // Amount in GH₵
  cups: Number,                   // Number of coffee units (1-10)
  message: String,                // Optional personal message (max 150 chars)
  reference: String,              // Paystack reference (unique)
  status: String,                 // 'pending' | 'success' | 'failed'
  created_at: DateTime,
  updated_at: DateTime
}
```

## API Endpoints

### 1. Initiate Coffee Purchase
**POST** `/api/coffee/initiate`

**Request:**
```json
{
  "recipient_username": "john_doe",
  "cups": 3,
  "donor_name": "Jane Smith",
  "donor_email": "jane@example.com",
  "message": "You rock!"  // optional
}
```

**Response:**
```json
{
  "authorization_url": "https://checkout.paystack.com/...",
  "reference": "cof_abc123def456"
}
```

### 2. Verify Coffee Payment
**POST** `/api/coffee/verify`

**Request:**
```json
{
  "reference": "cof_abc123def456"
}
```

**Response:**
```json
{
  "message": "Coffee sent!",
  "status": "success",
  "user": { ... }
}
```

### 3. Get Recent Coffees Received
**GET** `/api/coffee/recent?page=1`

**Authorization:** Required (JWT)

**Response:**
```json
{
  "coffees": [
    {
      "id": "coffee_id",
      "donor_name": "Jane Smith",
      "amount": 15,
      "message": "You rock!",
      "created_at": "2026-05-23T10:30:00",
      "type": "coffee"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

### 4. Get Coffee Statistics
**GET** `/api/coffee/stats`

**Authorization:** Required (JWT)

**Response:**
```json
{
  "stats": {
    "coffee_total": 450,         // Total amount received
    "coffee_count": 25,          // Number of coffees received
    "total_cups": 75             // Total cups equivalent
  }
}
```

## Frontend Integration

### 1. Initiate Payment
```javascript
import { initiateCoffee } from "../api/coffee";

const handleBuy = async (amount, message) => {
  try {
    const res = await initiateCoffee({
      recipient_username: recipient.username,
      cups: amount / 3,  // Convert amount to cups
      donor_name: name,
      donor_email: email,
      message
    });
    
    // Redirect to Paystack
    window.location.href = res.authorization_url;
  } catch (error) {
    console.error("Payment failed", error);
  }
};
```

### 2. Verify Payment
```javascript
import { verifyCoffee } from "../api/coffee";

useEffect(() => {
  const reference = new URLSearchParams(window.location.search).get('reference');
  if (reference) {
    verifyCoffee(reference)
      .then(res => {
        // Payment successful
        toast.success("Coffee sent!");
      })
      .catch(err => toast.error("Payment verification failed"));
  }
}, []);
```

### 3. Display Stats in Dashboard
```javascript
const [stats, setStats] = useState(null);

useEffect(() => {
  getMyStats().then(res => {
    setStats(res.data.stats);
  });
}, []);

// Display coffee stats
<div>
  <div>Total from Coffees: GH₵{stats?.coffee_total || 0}</div>
  <div>Coffee Received: {stats?.coffee_count || 0}</div>
</div>
```

## Configuration

### Pricing
- Default: GH₵5 per coffee unit
- Modify in `/app/routes/coffee.py`:
```python
COFFEE_PRICE_GHC = 5  # Change this value
```

### Message Limits
- Max message length: 150 characters
- Enforce in frontend validation

## Testing

### 1. Test Payment Initiation
```bash
curl -X POST http://localhost:5000/api/coffee/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_username": "test_user",
    "cups": 3,
    "donor_name": "Test Supporter",
    "donor_email": "test@example.com",
    "message": "Great content!"
  }'
```

### 2. Test Webhook Verification
Use Paystack test card: `4111 1111 1111 1111`

## Troubleshooting

### Issue: Coffee not appearing in stats
- Check if `status` is set to "success"
- Verify `recipient_id` matches user ID
- Check database timestamps

### Issue: Payment not verifying
- Ensure Paystack API key is correct
- Check webhook configuration
- Verify reference format

### Issue: Message not saving
- Check message length (max 150)
- Verify emoji encoding if used
- Check database field type

## Migration Notes

If upgrading from old system:
1. Run database migration to create coffee collection
2. Aggregate old data into coffee collection format
3. Update user total_received calculations
