'use client';

import { Button } from '@/components/ui/button';
import { CardInput } from '@/components/ui/card-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import CardDisplay from './CardDisplay';

// Card validation schema
const luhnRegex = /^[0-9]{13,19}$/;

// Normalize card input by stripping spaces before running checks
const normalizeCardNumber = (num: string) => num.replace(/\s+/g, '');

const luhnCheck = (num: string) => {
  const digitsOnly = normalizeCardNumber(num);
  if (!luhnRegex.test(digitsOnly)) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const creditCardSchema = z.object({
  cardNumber: z
    .string()
    .refine((val) => /^\d+$/.test(normalizeCardNumber(val)), {
      message: 'Card number must contain only digits'
    })
    .refine(
      (val) => {
        const cleaned = normalizeCardNumber(val);
        return cleaned.length >= 13 && cleaned.length <= 19;
      },
      {
        message: 'Card number must be 13-19 digits'
      }
    )
    .refine((val) => luhnCheck(val), 'Invalid card number'),
  cardholderName: z
    .string()
    .min(3, 'Cardholder name must be at least 3 characters')
    .max(60, 'Cardholder name cannot exceed 60 characters')
    .regex(/^[a-zA-Z\s'.-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  expiryMonth: z
    .number()
    .min(1, 'Month must be between 1-12')
    .max(12, 'Month must be between 1-12'),
  expiryYear: z
    .number()
    .min(new Date().getFullYear(), 'Card has expired')
    .refine((year) => year <= new Date().getFullYear() + 20, 'Invalid expiry year'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  saveCard: z.boolean().optional()
});

export type CreditCardFormData = z.infer<typeof creditCardSchema>;

interface CreditCardFormProps {
  onSubmit: (data: CreditCardFormData) => Promise<void> | void;
  isLoading?: boolean;
  showSaveOption?: boolean;
  submitButtonText?: string;
}

/**
 * Credit Card Form Component
 * Handles card number, expiry, CVV, and cardholder name input
 */
export default function CreditCardForm({
  onSubmit,
  isLoading = false,
  showSaveOption = true,
  submitButtonText = 'Continue'
}: CreditCardFormProps) {
  const form = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      cardNumber: '',
      cardholderName: '',
      expiryMonth: 1,
      expiryYear: new Date().getFullYear(),
      cvv: '',
      saveCard: false
    },
    mode: 'onChange'
  });

  const cardNumber = form.watch('cardNumber');
  const expiryMonth = form.watch('expiryMonth');
  const expiryYear = form.watch('expiryYear');
  const cardholderName = form.watch('cardholderName');

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = normalizeCardNumber(e.target.value);
      if (value.length > 19) {
        value = value.slice(0, 19);
      }
      form.setValue('cardNumber', value, { shouldValidate: true });
    },
    [form]
  );

  // Calculate card expiry validity
  const isCardExpired = useMemo(() => {
    const now = new Date();
    const cardExp = new Date(expiryYear, expiryMonth - 1);
    return cardExp < now;
  }, [expiryMonth, expiryYear]);

  const displayCardNumber = useMemo(() => {
    if (!cardNumber) return '';
    return (
      cardNumber
        .replace(/\s/g, '')
        .match(/.{1,4}/g)
        ?.join(' ') || ''
    );
  }, [cardNumber]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Preview */}
      <CardDisplay
        cardNumber={displayCardNumber}
        cardholderName={cardholderName}
        expiryMonth={expiryMonth}
        expiryYear={expiryYear}
      />

      {/* Card Details Section */}
      <FieldSet>
        <FieldGroup>
          {/* Card Number */}
          <Field>
            <FieldLabel htmlFor="cardNumber">Card Number</FieldLabel>
            <CardInput
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              maxLength={23}
              {...form.register('cardNumber')}
              onChange={handleCardNumberChange}
              value={displayCardNumber}
              autoComplete="cc-number"
              disabled={isLoading}
            />
            {form.formState.errors.cardNumber && (
              <FieldError>{form.formState.errors.cardNumber.message}</FieldError>
            )}
          </Field>

          {/* Cardholder Name */}
          <Field>
            <FieldLabel htmlFor="cardholderName">Cardholder Name</FieldLabel>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              {...form.register('cardholderName')}
              autoComplete="cc-name"
              disabled={isLoading}
            />
            {form.formState.errors.cardholderName && (
              <FieldError>{form.formState.errors.cardholderName.message}</FieldError>
            )}
          </Field>

          {/* Expiry and CVV Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expiry Date */}
            <Field>
              <FieldLabel htmlFor="expiryMonth">Expiry Date</FieldLabel>
              <div className="flex gap-2">
                <div className="flex-1">
                  <NumberInput
                    placeholder="MM"
                    min={1}
                    max={12}
                    value={expiryMonth}
                    onValueChange={(val) => {
                      if (val !== undefined) {
                        form.setValue('expiryMonth', val, { shouldValidate: true });
                      }
                    }}
                    disabled={isLoading}
                    className="text-center"
                    withControl={false}
                    allowNegative={false}
                    decimalScale={0}
                  />
                </div>
                <div className="text-muted-foreground flex items-center">/</div>
                <div className="flex-1">
                  <NumberInput
                    placeholder="YYYY"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 20}
                    value={expiryYear}
                    onValueChange={(val) => {
                      if (val !== undefined) {
                        form.setValue('expiryYear', val, { shouldValidate: true });
                      }
                    }}
                    disabled={isLoading}
                    className="text-center"
                    withControl={false}
                    allowNegative={false}
                    decimalScale={0}
                  />
                </div>
              </div>
              {form.formState.errors.expiryMonth && (
                <FieldError>{form.formState.errors.expiryMonth.message}</FieldError>
              )}
              {form.formState.errors.expiryYear && (
                <FieldError>{form.formState.errors.expiryYear.message}</FieldError>
              )}
              {isCardExpired && <FieldError className="text-sm">Card has expired</FieldError>}
            </Field>

            {/* CVV */}
            <Field>
              <FieldLabel htmlFor="cvv">CVV</FieldLabel>
              <NumberInput
                placeholder="123"
                value={form.watch('cvv') ? parseInt(form.watch('cvv'), 10) : undefined}
                onValueChange={(val) => {
                  if (val !== undefined) {
                    const cvvString = val.toString().slice(0, 4);
                    form.setValue('cvv', cvvString, { shouldValidate: true });
                  } else {
                    form.setValue('cvv', '', { shouldValidate: true });
                  }
                }}
                disabled={isLoading}
                withControl={false}
                allowNegative={false}
                decimalScale={0}
                isAllowed={(values) => {
                  const { value } = values;
                  return value.length <= 4;
                }}
              />
              {form.formState.errors.cvv && (
                <FieldError>{form.formState.errors.cvv.message}</FieldError>
              )}
            </Field>
          </div>

          {/* Save Card Option */}
          {showSaveOption && (
            <Field>
              <div className="flex items-center gap-3">
                <Checkbox id="saveCard" {...form.register('saveCard')} disabled={isLoading} />
                <FieldLabel htmlFor="saveCard" className="mt-0! cursor-pointer text-sm">
                  Simpan kartu untuk pembayaran di masa mendatang
                </FieldLabel>
              </div>
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !form.formState.isValid}
        loading={isLoading}
      >
        {submitButtonText}
      </Button>
    </form>
  );
}
