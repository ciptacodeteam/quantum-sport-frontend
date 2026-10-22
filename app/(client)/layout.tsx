import type { PropsWithChildren } from 'react';

const ClientLayout = ({ children }: PropsWithChildren) => {
  return <div className="mx-auto max-w-lg has-[.booking-page]:max-w-none">{children}</div>;
};
export default ClientLayout;
