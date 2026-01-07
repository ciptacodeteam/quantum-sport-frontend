# 🚀 Quick Start Guide - Credit Card Integration

## For Frontend Developers

### 1️⃣ Understand the Architecture (5 min read)

Read these files in order:

1. [CREDIT_CARD_IMPLEMENTATION_SUMMARY.md](./CREDIT_CARD_IMPLEMENTATION_SUMMARY.md) - Overview
2. [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - Diagrams and flows
3. [CREDIT_CARD_INTEGRATION.md](./CREDIT_CARD_INTEGRATION.md) - Detailed guide

### 2️⃣ Key Components to Know

**Main Entry Point:**

```tsx
// In your checkout page, replace payment method dialog with:
import PaymentMethodSelector from '@/components/forms/payment/PaymentMethodSelector';

<PaymentMethodSelector
  isOpen={isPaymentModalOpen}
  onClose={() => setPaymentModalOpen(false)}
  paymentMethods={paymentMethods}
  selectedMethod={selectedPaymentMethod}
  onMethodSelect={handleSelectPaymentMethod}
  courtSlots={courtSlots}
  coachSlots={coachSlots}
  ballboySlots={ballboySlots}
  inventories={inventories}
  totalAmount={totalWithPaymentFee}
/>;
```

**User Profile (Saved Cards):**

```tsx
// Add to user profile/settings page:
import SavedCardsManager from '@/components/profile/SavedCardsManager';

<SavedCardsManager />;
```

### 3️⃣ Payment Mutation Pattern

```tsx
import { useMutation } from '@tanstack/react-query';
import { cardCheckoutMutationOptions } from '@/mutations/payment';

// In your checkout component:
const cardCheckoutMutation = useMutation(
  cardCheckoutMutationOptions({
    onSuccess: (data) => {
      // Payment successful or 3DS redirect happened
      // Mutation handles 3DS automatically
    },
    onError: (error) => {
      // Handle error
    }
  })
);
```

### 4️⃣ API Functions Quick Reference

```tsx
import {
  saveCreditCardApi,
  listCreditCardsApi,
  deleteCreditCardApi,
  updateCreditCardApi,
  cardCheckoutApi,
  membershipCardCheckoutApi
} from '@/api/credit-cards';

// Save a new card
const response = await saveCreditCardApi({
  cardNumber: '4000000000001091',
  cardholderName: 'John Doe',
  expiryMonth: 12,
  expiryYear: 2027,
  cvv: '123',
  isDefault: true
});

// Checkout with new card
const response = await cardCheckoutApi({
  paymentMethodId: 'pm_credit_card',
  courtSlots: ['slot_1', 'slot_2'],
  cardPayment: {
    cardNumber: '4000000000001091',
    cardholderName: 'John Doe',
    expiryMonth: 12,
    expiryYear: 2027,
    newCardCvv: '123',
    saveCard: true
  }
});

// Checkout with saved card
const response = await cardCheckoutApi({
  paymentMethodId: 'pm_credit_card',
  courtSlots: ['slot_1'],
  cardPayment: {
    savedCardId: 'card_xyz123',
    cvv: '123'
  }
});
```

---

## For Backend Developers

### 1️⃣ What the Frontend Expects

#### Request Payloads

**New Card Checkout:**

```json
{
  "paymentMethodId": "pm_credit_card",
  "courtSlots": ["slot_1", "slot_2"],
  "coachSlots": ["coach_1"],
  "ballboySlots": ["ballboy_1"],
  "inventories": [{ "inventoryId": "inv_1", "quantity": 2 }],
  "cardPayment": {
    "cardNumber": "4000000000001091",
    "cardholderName": "John Doe",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "newCardCvv": "123",
    "saveCard": true
  }
}
```

**Saved Card Checkout:**

```json
{
  "paymentMethodId": "pm_credit_card",
  "courtSlots": ["slot_1"],
  "cardPayment": {
    "savedCardId": "card_xyz123",
    "cvv": "123"
  }
}
```

**Save Card:**

```json
{
  "cardNumber": "4000000000001091",
  "cardholderName": "John Doe",
  "expiryMonth": 12,
  "expiryYear": 2027,
  "cvv": "123",
  "isDefault": true
}
```

#### Response Payloads

**Success (No 3DS Required):**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_abc123",
    "invoiceId": "invoice_xyz789",
    "invoiceNumber": "INV-260106-A3K9FT",
    "totalPrice": 500000,
    "processingFee": 15000,
    "total": 515000,
    "status": "CONFIRMED",
    "paymentStatus": "PAID"
  }
}
```

**3DS Required:**

```json
{
  "success": true,
  "data": {
    "bookingId": "booking_abc123",
    "invoiceId": "invoice_xyz789",
    "invoiceNumber": "INV-260106-A3K9FT",
    "totalPrice": 500000,
    "processingFee": 15000,
    "total": 515000,
    "status": "HOLD",
    "paymentStatus": "REQUIRES_ACTION",
    "paymentActions": [
      {
        "type": "REDIRECT_CUSTOMER",
        "value": "https://xendit.co/3ds/challenge/abc123xyz789",
        "descriptor": "WEB_URL"
      }
    ],
    "paymentUrl": "https://xendit.co/3ds/challenge/abc123xyz789"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Card declined by issuer",
  "data": null
}
```

### 2️⃣ Implementation Checklist

**Database Schema:**

- [ ] Create `credit_cards` table:

  ```sql
  CREATE TABLE credit_cards (
    id VARCHAR PRIMARY KEY,
    userId VARCHAR NOT NULL,
    cardToken VARCHAR NOT NULL UNIQUE,
    cardBrand VARCHAR NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    expMonth INT NOT NULL,
    expYear INT NOT NULL,
    isDefault BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
  ```

- [ ] Update `invoices` table to include:
  ```sql
  ALTER TABLE invoices ADD COLUMN paymentStatus VARCHAR DEFAULT 'PENDING';
  -- Values: PENDING, PAID, FAILED, EXPIRED, CANCELLED
  ```

**API Endpoints:**

- [ ] `POST /credit-cards` - Save card
- [ ] `GET /credit-cards` - List cards
- [ ] `GET /credit-cards/:id` - Get card
- [ ] `PUT /credit-cards/:id` - Update card
- [ ] `DELETE /credit-cards/:id` - Delete card
- [ ] `POST /checkout` - Enhanced checkout (accept cardPayment)
- [ ] `POST /checkout/membership` - Enhanced membership checkout

**Xendit Integration:**

- [ ] Setup Xendit account
- [ ] Get API keys (test & production)
- [ ] Implement tokenization endpoint
- [ ] Implement 3DS detection
- [ ] Setup webhook receiver

**Webhook Handling:**

- [ ] Create webhook endpoint (e.g., `/webhooks/xendit`)
- [ ] Verify webhook signature
- [ ] Parse payment completion
- [ ] Update invoice status (PENDING → PAID)
- [ ] Update booking status (HOLD → CONFIRMED)
- [ ] Send confirmation email

### 3️⃣ Xendit Integration Example (Node.js)

```javascript
const xendit = require('xendit');
xendit.setApiKey(process.env.XENDIT_API_KEY);

// Save credit card (tokenization)
async function tokenizeCard(req) {
  const { cardNumber, cardholderName, expiryMonth, expiryYear } = req.body;

  const tokenResponse = await xendit.tokenization.createToken({
    number: cardNumber,
    exp_month: expiryMonth,
    exp_year: expiryYear,
    name: cardholderName,
    currency: 'IDR'
  });

  // Save token to database, NOT raw card data
  return tokenResponse.id; // token id
}

// Process payment with 3DS
async function processPayment(req) {
  const { amount, savedCardId, description } = req.body;

  const chargeResponse = await xendit.directDebit.createDirectDebitCharge({
    reference_id: invoiceId,
    currency: 'IDR',
    amount: amount,
    channel_code: 'CARDS',
    payment_method: {
      type: 'CARD',
      card: {
        token_id: savedCardId // Use token, not raw data
      }
    },
    callback_url: 'https://yourapp.com/webhooks/xendit',
    metadata: {
      description: description
    }
  });

  // Check if 3DS required
  if (chargeResponse.status === 'REQUIRES_ACTION') {
    return {
      paymentStatus: 'REQUIRES_ACTION',
      paymentUrl: chargeResponse.actions[0].url
    };
  }

  return {
    paymentStatus: chargeResponse.status === 'SUCCEEDED' ? 'PAID' : 'FAILED'
  };
}

// Handle webhook from Xendit
router.post('/webhooks/xendit', async (req, res) => {
  const payload = req.body;

  // Verify signature
  const signature = req.headers['x-xendit-token'];
  // ... verify signature logic

  if (payload.event === 'payment.capture') {
    const { status, reference_id } = payload.data;

    // Update invoice
    await db.invoices.update(
      { where: { number: reference_id } },
      { paymentStatus: status === 'SUCCEEDED' ? 'PAID' : 'FAILED' }
    );

    // Update booking if payment successful
    if (status === 'SUCCEEDED') {
      const invoice = await db.invoices.findUnique({
        where: { number: reference_id }
      });

      await db.bookings.update({ where: { id: invoice.bookingId } }, { status: 'CONFIRMED' });
    }
  }

  res.json({ status: 'ok' });
});
```

### 4️⃣ Testing with Postman

**Save Card:**

```
POST http://localhost:3000/api/credit-cards
Authorization: Bearer <token>
Content-Type: application/json

{
  "cardNumber": "4000000000001091",
  "cardholderName": "John Doe",
  "expiryMonth": 12,
  "expiryYear": 2027,
  "cvv": "123",
  "isDefault": true
}
```

**Checkout with New Card:**

```
POST http://localhost:3000/api/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "pm_credit_card",
  "courtSlots": ["slot_1"],
  "cardPayment": {
    "cardNumber": "4000000000001091",
    "cardholderName": "John Doe",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "newCardCvv": "123",
    "saveCard": true
  }
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: New Card Payment (No 3DS)

```
Frontend:
1. User selects "Credit Card"
2. Enters new card details
3. Clicks "Pay Now"

Backend:
1. Validate payload
2. Tokenize with Xendit
3. Save card token
4. Process payment
5. Return success response

Frontend:
1. Receives success response
2. Clears cart
3. Redirects to invoice page
```

### Scenario 2: New Card Payment (With 3DS)

```
Frontend:
1. User enters card details
2. Clicks "Pay Now"

Backend:
1. Returns paymentStatus: "REQUIRES_ACTION"
2. Returns paymentUrl from Xendit

Frontend:
1. Stores data in sessionStorage
2. Redirects to paymentUrl (Xendit 3DS page)

User:
1. Completes 3DS authentication
2. Gets redirected to /checkout/3ds-challenge

Frontend:
1. use3DSChallenge hook activates
2. Polls payment status
3. Receives webhook confirmation
4. Redirects to invoice page
```

### Scenario 3: Saved Card Payment

```
Frontend:
1. User switches to "Saved Cards" tab
2. Selects saved card
3. Enters CVV
4. Clicks "Pay Now"

Backend:
1. Validate payload
2. Use saved card token
3. Process payment
4. Same 3DS flow as new card
```

---

## 📊 Debugging Tips

### Frontend Debugging

**Check API response:**

```tsx
cardCheckoutMutation.mutate(payload);
// In React DevTools, check network tab:
// - Response status
// - paymentStatus value
// - paymentUrl presence
```

**Check sessionStorage:**

```javascript
// In browser console:
console.log(JSON.parse(sessionStorage.getItem('payment_3ds_data')));
```

**Monitor 3DS hook:**

```tsx
const { isLoading, error, status, paymentData } = use3DSChallenge();
console.log('3DS Status:', status); // 'pending' | 'success' | 'failed'
```

### Backend Debugging

**Xendit tokenization:**

```javascript
console.log('Tokenizing card...');
console.log('Last 4:', cardNumber.slice(-4)); // Never log full card
console.log('Token ID:', tokenResponse.id);
```

**Payment processing:**

```javascript
console.log('Processing payment with token:', savedCardId);
console.log('Amount:', amount);
console.log('Response status:', chargeResponse.status);
```

**Webhook verification:**

```javascript
console.log('Webhook received for:', reference_id);
console.log('Payment status:', status);
console.log('Updating invoice...');
```

---

## 🆘 Common Issues & Solutions

| Issue                    | Cause                    | Solution                                  |
| ------------------------ | ------------------------ | ----------------------------------------- |
| Card validation fails    | Luhn check fails         | Verify test card number: 4000000000001091 |
| Expiry rejected          | Year format wrong        | Use 4-digit year: 2027 not 27             |
| 3DS not triggering       | Not configured in Xendit | Check Xendit dashboard settings           |
| Webhook not received     | Webhook URL wrong        | Configure correct URL in Xendit           |
| Card not saving          | No saveCard flag         | Ensure `saveCard: true` in payload        |
| Saved card not appearing | Query issue              | Check user authentication, query cache    |

---

## 📞 Quick Links

- **Frontend Integration Guide**: [CREDIT_CARD_INTEGRATION.md](./CREDIT_CARD_INTEGRATION.md)
- **Visual Diagrams**: [VISUAL_GUIDE.md](./VISUAL_GUIDE.md)
- **Implementation Summary**: [CREDIT_CARD_IMPLEMENTATION_SUMMARY.md](./CREDIT_CARD_IMPLEMENTATION_SUMMARY.md)
- **Integration Checklist**: [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)
- **Xendit Docs**: https://docs.xendit.co/
- **Xendit Sandbox**: https://dashboard.xendit.co/

---

**Ready to integrate? Start with step 1️⃣ and follow the checklist!** 🚀
