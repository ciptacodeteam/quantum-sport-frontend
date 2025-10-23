export enum Role {
  ADMIN = 'admin',
  USER = 'user',
  BALLBOY = 'ballboy',
  COACH = 'coach'
}

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
