type PaymentAction = {
  descriptor?: string;
  type?: string;
  value?: string;
  url?: string;
  display_name?: string;
  expiry?: string;
};
type PaymentMeta = {
  channel_code?: string;
  actions?: PaymentAction[];
  channel_properties?: Record<string, string | undefined>;
};
export type PaymentInvoice = {
  id: string;
  number?: string;
  total: number;
  status: string;
  dueDate?: string | null;
  paymentUrl?: string | null;
  paymentMeta?: PaymentMeta | null;
  payment?: {
    meta?: PaymentMeta | null;
    method?: { name?: string; channel?: string | null; logo?: string | null };
  } | null;
  paymentInstructions?: {
    type?: string;
    qrString?: string;
    accountNumber?: string;
    accountName?: string;
    billerCode?: string;
    billKey?: string;
    expiresAt?: string;
    url?: string;
  } | null;
};

export function getInvoicePayment(invoice: PaymentInvoice) {
  const meta = invoice.paymentMeta ?? invoice.payment?.meta;
  const instructions = invoice.paymentInstructions;
  const actions = Array.isArray(meta?.actions) ? meta.actions : [];
  const props = meta?.channel_properties;
  const channel = (meta?.channel_code || invoice.payment?.method?.channel || '').toUpperCase();
  const va = actions.find((action) =>
    ['VIRTUAL_ACCOUNT_NUMBER', 'ACCOUNT_NUMBER'].includes(action.descriptor ?? '')
  );
  const qrString =
    actions.find((action) => action.descriptor === 'QR_STRING')?.value ||
    props?.qr_string ||
    instructions?.qrString;
  const vaNumber =
    va?.value ||
    props?.virtual_account_number ||
    props?.account_number ||
    instructions?.accountNumber;
  const redirect = actions.find(
    (action) =>
      action.type === 'REDIRECT' ||
      ['DEEPLINK_CHECKOUT', 'WEB_URL', 'MOBILE_URL'].includes(action.descriptor ?? '')
  );
  const redirectCandidate =
    redirect?.url || redirect?.value || invoice.paymentUrl || instructions?.url;
  const paymentUrl =
    redirectCandidate && /^https?:\/\//i.test(redirectCandidate) ? redirectCandidate : undefined;
  const billerCode = props?.biller_code || instructions?.billerCode;
  return {
    channel,
    isQRIS: channel === 'QRIS' || channel === 'QR' || instructions?.type === 'QRIS',
    isVA:
      channel.includes('VIRTUAL_ACCOUNT') ||
      channel.endsWith('_VA') ||
      channel === 'VA' ||
      instructions?.type === 'VIRTUAL_ACCOUNT',
    qrString,
    qrIsImage: Boolean(qrString && /^https?:\/\//i.test(qrString)),
    vaNumber,
    billerCode,
    displayName: instructions?.accountName || va?.display_name,
    paymentUrl,
    expiresAt: invoice.dueDate || instructions?.expiresAt || props?.expires_at || va?.expiry
  };
}
