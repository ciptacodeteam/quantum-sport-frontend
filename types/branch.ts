export type Branch = {
  id: string;
  name: string;
  address: string;
  mapsUrl?: string | null;
  isActive: boolean;
  sequence?: number;
};
