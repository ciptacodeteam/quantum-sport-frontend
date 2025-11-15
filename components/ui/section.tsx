'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

const Section = ({ children, className }: SectionProps) => {
  return <Card className={cn('gap-4 border-none pt-2 shadow-none', className)}>{children}</Card>;
};

type SectionHeaderProps = {
  className?: string;
  children?: React.ReactNode;
};

const SectionHeader = ({ className, children }: SectionHeaderProps) => {
  return <CardHeader className={cn('space-y-2 px-2', className)}>{children}</CardHeader>;
};

type SectionTitleProps = {
  title: string;
  className?: string;
};

const SectionTitle = ({ title, className }: SectionTitleProps) => {
  return <CardTitle className={cn(className)}>{title}</CardTitle>;
};

type SectionDescriptionProps = {
  description: string;
  className?: string;
};

const SectionDescription = ({ description, className }: SectionDescriptionProps) => {
  return <CardDescription className={cn(className)}>{description}</CardDescription>;
};

type SectionContentProps = {
  children: React.ReactNode;
  className?: string;
};

const SectionContent = ({ children, className }: SectionContentProps) => {
  return <CardContent className={cn('px-2', className)}>{children}</CardContent>;
};

export { Section, SectionTitle, SectionDescription, SectionHeader, SectionContent };
