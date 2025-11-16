import { Card, CardContent } from '@/components/ui/card';

export default function SuccessMessageCard() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-green-800">Pembayaran Berhasil!</h3>
          <p className="text-green-700">
            Terima kasih telah melakukan pembayaran. Booking Anda telah dikonfirmasi.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
