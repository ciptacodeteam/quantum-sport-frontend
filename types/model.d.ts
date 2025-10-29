export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  joinedAt: Date | null;
  isActive: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  phone: string;
  phoneVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Inventory = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentMethod = {
  id: string;
  name: string;
  isActive: boolean;
  fees: number;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Banner = {
  id: string;
  isActive: boolean;
  image: string | null;
  link: string | null;
  sequence: number;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Court = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  image: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
