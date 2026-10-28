'use client';
import type { Banner } from '@/types/model';
import BannerForm from './BannerForm';
export default function EditBannerForm({
  data,
  readOnly = false
}: {
  data: Banner;
  readOnly?: boolean;
}) {
  return <BannerForm data={data} readOnly={readOnly} />;
}
