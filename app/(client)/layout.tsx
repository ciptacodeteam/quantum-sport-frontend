import type { PropsWithChildren } from 'react';

const ClientLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="mx-auto max-w-lg has-[.addons-page]:max-w-none has-[.booking-page]:max-w-none has-[.checkout-page]:max-w-none has-[.history-page]:max-w-none has-[.invoice-page]:max-w-none has-[.my-packages-page]:max-w-none has-[.profile-page]:max-w-none has-[.terms-page]:max-w-none has-[.value-pack-page]:max-w-none">
      {children}
    </div>
  );
};
export default ClientLayout;
