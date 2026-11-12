'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ParticipantCountInput({
  id,
  value,
  onChange,
  disabled,
  decrementLabel = 'Kurangi peserta',
  incrementLabel = 'Tambah peserta',
  describedBy
}: {
  id: string;
  value: number;
  onChange: (count: number) => void;
  disabled?: boolean;
  decrementLabel?: string;
  incrementLabel?: string;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(value);
  const valid =
    text !== '' && Number.isInteger(Number(text)) && Number(text) >= 1 && Number(text) <= 100;
  const invalid = text !== '' && !valid;
  const errorId = `${id}-error`;
  return (
    <div className="w-fit space-y-2">
      <div className="border-border bg-background flex w-fit items-center rounded-md border p-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={decrementLabel}
          disabled={disabled || value <= 1}
          onClick={() => {
            setDraft(null);
            onChange(value - 1);
          }}
        >
          <Minus className="size-3.5" />
        </Button>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          step={1}
          value={text}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={
            [describedBy, invalid ? errorId : null].filter(Boolean).join(' ') || undefined
          }
          className="h-8 w-14 [appearance:textfield] rounded-none border-0 px-1 text-center font-semibold shadow-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const count = Number(next);
            if (next !== '' && Number.isInteger(count) && count >= 1 && count <= 100)
              onChange(count);
          }}
          onBlur={() => setDraft(null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label={incrementLabel}
          disabled={disabled || value >= 100}
          onClick={() => {
            setDraft(null);
            onChange(value + 1);
          }}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {invalid && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          Masukkan angka bulat 1–100.
        </p>
      )}
    </div>
  );
}
