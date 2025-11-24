import type { PropsWithChildren } from 'react';

const ClientLayout = ({ children }: PropsWithChildren) => {
  return <div className="mx-auto max-w-lg">{children}</div>;
};
export default ClientLayout;
