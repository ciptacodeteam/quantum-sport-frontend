# Credit Card Payment Integration Guide

## Overview

This document explains how to integrate the credit card payment system with 3DS authentication into your checkout flow.

## Component Structure

### 1. **Credit Card Form Components**

- `components/forms/payment/CreditCardForm.tsx` - Main form for entering new card details
- `components/forms/payment/CardDisplay.tsx` - Visual card preview component
- `components/forms/payment/SavedCardSelector.tsx` - Component to select from saved cards

### 2. **Checkout Components**

- `components/forms/payment/CreditCardCheckout.tsx` - Wrapper handling both new and saved cards
- `components/forms/payment/PaymentMethodSelector.tsx` - Dialog for selecting payment method (including credit card)
- `components/profile/SavedCardsManager.tsx` - Management UI for saved cards (for user profile)

### 3. **API Layer**

- `api/credit-cards.ts` - API functions for card operations and checkout

### 4. **Mutations**

- `mutations/payment.ts` - React Query mutations for payment operations

### 5. **Hooks**

- `hooks/use3DSChallenge.ts` - Hook for handling 3DS challenge flow

### 6. **Pages**

- `app/(client)/checkout/3ds-challenge/page.tsx` - 3DS authentication redirect page

## Integration Steps

### Step 1: Update Payment Method Selection

Replace your existing payment method dialog with `PaymentMethodSelector`:

```tsx
import PaymentMethodSelector from '@/components/forms/payment/PaymentMethodSelector';

// In your checkout component:
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

### Step 2: Update Checkout Mutation

The checkout flow now handles credit cards differently:

```tsx
import { cardCheckoutMutationOptions } from '@/mutations/payment';

// For credit cards
const cardCheckoutMutation = useMutation(
  cardCheckoutMutationOptions({
    onSuccess: (data) => {
      // Handle success - mutation already handles 3DS redirect
    }
  })
);

// For other payment methods (existing flow)
const otherCheckoutMutation = useMutation(
  checkoutMutationOptions({
    onSuccess: (data) => {
      // Redirect to invoice
    }
  })
);
```

### Step 3: Handle Different Payment Methods

```tsx
const handleCheckout = () => {
  if (selectedPaymentMethod?.channel === 'CARDS') {
    // Credit card checkout is handled by CreditCardCheckout component
    // No manual action needed here
    return;
  }

  // Other payment methods
  const payload = {
    paymentMethodId: selectedPaymentMethod.id,
    courtSlots,
    coachSlots,
    ballboySlots,
    inventories
  };

  otherCheckoutMutation.mutate(payload);
};
```

## Payment Flow

### New Credit Card Payment

```
User selects "Credit Card" payment method
  ↓
CreditCardCheckout component opens
  ↓
User enters card details
  ↓
Clicks "Pay Now"
  ↓
CreditCardForm validates & submits
  ↓
API sends to POST /checkout with cardPayment object
  ↓
Server tokenizes card & processes payment
  ↓
If 3DS required:
  - Response includes paymentStatus: "REQUIRES_ACTION" and paymentUrl
  - Mutation redirects user to paymentUrl
  ↓
User completes 3DS authentication at Xendit
  ↓
Redirect back to /checkout/3ds-challenge
  ↓
use3DSChallenge hook polls payment status
  ↓
Payment confirmed → Redirect to /invoice/{invoiceNumber}
```

### Saved Credit Card Payment

```
User selects saved card from list
  ↓
Enters CVV
  ↓
Clicks "Pay Now"
  ↓
CreditCardCheckout submits with savedCardId
  ↓
API sends to POST /checkout with cardPayment object
  ↓
Same 3DS flow as new card
```

### Other Payment Methods (Bank Transfer, E-Wallet, etc.)

```
User selects payment method
  ↓
Dialog closes
  ↓
User clicks "Bayar Sekarang"
  ↓
Standard checkout mutation
  ↓
Redirect to payment page or invoice
```

## API Payloads

### New Credit Card (No Save)

```json
{
  "paymentMethodId": "pm_credit_card_id",
  "courtSlots": ["slot_1", "slot_2"],
  "cardPayment": {
    "cardNumber": "4000000000001091",
    "cardholderName": "John Doe",
    "expiryMonth": 12,
    "expiryYear": 2027,
    "newCardCvv": "123",
    "saveCard": false
  }
}
```

### New Credit Card (Save for Future)

```json
{
  "paymentMethodId": "pm_credit_card_id",
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

### Saved Credit Card

```json
{
  "paymentMethodId": "pm_credit_card_id",
  "courtSlots": ["slot_1"],
  "cardPayment": {
    "savedCardId": "card_xyz123",
    "cvv": "123"
  }
}
```

## 3DS Authentication Flow

The 3DS challenge is handled automatically by:

1. **Mutation Handler** (`mutations/payment.ts`)
   - Checks for `paymentStatus === "REQUIRES_ACTION"`
   - Stores payment data in sessionStorage
   - Redirects to Xendit 3DS URL

2. **3DS Challenge Page** (`app/(client)/checkout/3ds-challenge/page.tsx`)
   - Displays loading/authenticating state
   - Uses `use3DSChallenge` hook to poll status

3. **use3DSChallenge Hook** (`hooks/use3DSChallenge.ts`)
   - Retrieves stored payment data
   - Polls invoice status until confirmed
   - Handles success/failure states

## Saved Cards Management

### Display in Checkout

- `SavedCardSelector` component automatically fetches and displays saved cards
- Users can select a card and re-enter CVV

### Management Page (User Profile)

```tsx
import SavedCardsManager from '@/components/profile/SavedCardsManager';

// In user profile/settings page:
<SavedCardsManager />;
```

Features:

- List all saved cards (masked card number, brand, expiry)
- Mark card as default
- Delete card
- Add new card

## Type Definitions

All types are defined in `types/model.d.ts`:

```typescript
type CreditCard = {
  id: string;
  cardBrand: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

type CardPaymentNewCard = {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  newCardCvv: string;
  saveCard?: boolean;
};

type CardPaymentSavedCard = {
  savedCardId: string;
  cvv: string;
};

type CardPayment = CardPaymentNewCard | CardPaymentSavedCard;
```

## Error Handling

All error messages are mapped to user-friendly messages:

| Error               | User Message                            |
| ------------------- | --------------------------------------- |
| Invalid card number | "Check your card details and try again" |
| Card declined       | "Card declined by issuer"               |
| Insufficient funds  | "Insufficient funds"                    |
| Invalid CVV         | "Invalid CVV"                           |
| Expired card        | "Card expired"                          |
| Amount too low      | "Amount is below minimum limit"         |

## Security Features

✅ **PCI Compliance**

- Card tokenization handled server-side
- Raw card data never stored locally or on server

✅ **3D Secure Authentication**

- Mandatory for all transactions
- User completes authentication with bank

✅ **Input Validation**

- Luhn check for card numbers
- Expiry date validation
- CVV validation

✅ **Data Protection**

- HTTPS only for all requests
- sessionStorage for temporary payment data
- Automatic cleanup after payment

## Testing

### Test Cards (Xendit Sandbox)

```
Successful Payment (Requires 3DS):
Card Number: 4000000000001091
CVV: Any 3 digits
Expiry: Any future date

Card Declined:
Card Number: 4000000000000002
CVV: Any 3 digits

Insufficient Funds:
Card Number: 4000000000009995

Expired Card:
Card Number: 4000000000000069
```

## Environment Setup

Make sure your backend is configured to:

1. **Accept credit card payments** - Ensure payment method with `channel: "CREDIT_CARD"` exists
2. **Handle Xendit webhooks** - Listen for payment completion webhooks
3. **Update invoice status** - Mark invoices as PAID when webhook received
4. **Update booking status** - Mark bookings as CONFIRMED when payment succeeds

## Troubleshooting

### Card details not validating

- Check Luhn algorithm implementation
- Ensure expiry year is 4 digits (2027, not 27)
- CVV must be 3-4 digits

### 3DS redirect not working

- Verify `paymentUrl` is in response
- Check sessionStorage for `payment_3ds_data`
- Ensure 3DS challenge page is at `/checkout/3ds-challenge`

### Payment status not updating

- Check webhook configuration on Xendit dashboard
- Verify invoice ID in response
- Ensure backend updates invoice status correctly

### Card save not working

- Verify `saveCard: true` is in payload
- Check that card save endpoint is implemented
- Ensure user is authenticated

## API Endpoints Required

These endpoints must be implemented on your backend:

```
POST /credit-cards                    - Save new card
GET /credit-cards                     - List saved cards
GET /credit-cards/:id                 - Get card details
PUT /credit-cards/:id                 - Update card (mark as default)
DELETE /credit-cards/:id              - Delete card
POST /checkout                        - Checkout (accepts cardPayment)
POST /checkout/membership             - Membership checkout (accepts cardPayment)
```

## Future Enhancements

- [ ] Card brand detection with icons
- [ ] Real-time card validation as user types
- [ ] Support for more card brands
- [ ] Digital wallet integration (Apple Pay, Google Pay)
- [ ] Saved card auto-completion
- [ ] Payment history
