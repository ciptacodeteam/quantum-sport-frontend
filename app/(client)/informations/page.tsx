'use client';

import Logo from '@/assets/img/logo.svg';
import { Card } from '@/components/ui/card';
import { getWhatsappMessageUrl } from '@/lib/utils';
import { IconBrandInstagram, IconBrandWhatsapp } from '@tabler/icons-react';
import { Calendar, FileText, Headphones, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function InformationsPage() {
  const links = [
    {
      title: 'Book Court',
      description: 'Reserve your court at Quantum Social Club',
      icon: Calendar,
      href: 'https://www.quantumsocialclub.id/booking',
      color: 'from-blue-500 to-cyan-500',
      external: false
    },
    {
      title: 'Quantum Location',
      description: 'Find us on Google Maps',
      icon: MapPin,
      href: 'https://maps.app.goo.gl/a5b6EUoXWiCnqQVj8',
      color: 'from-green-500 to-emerald-500',
      external: true
    },
    {
      title: 'Book Coaching Session',
      description: 'Schedule a session with our professional coaches',
      icon: MessageCircle,
      href: 'https://wa.me/message/675CKY4UOUGII1',
      color: 'from-purple-500 to-pink-500',
      external: true
    },
    {
      title: 'Pricelist',
      description: 'View our services and pricing',
      icon: FileText,
      href: 'https://drive.google.com/file/d/1AWcLknTY3LtW4CTyUnqd72tXImbGcvea/view?usp=drive_link',
      color: 'from-orange-500 to-red-500',
      external: true
    },
    {
      title: 'Customer Service',
      description: 'Contact us for assistance',
      icon: Headphones,
      href: 'https://wa.me/6282311160880',
      color: 'from-teal-500 to-cyan-500',
      external: true
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-purple-100 via-emerald-50 to-amber-100">
      {/* Animated gradient orbs */}
      <div className="absolute -top-32 -left-32 h-96 w-96 animate-pulse rounded-full bg-linear-to-r from-purple-400 to-emerald-400 opacity-20 blur-3xl"></div>
      <div className="absolute -right-32 -bottom-32 h-96 w-96 animate-pulse rounded-full bg-linear-to-r from-amber-400 to-cyan-400 opacity-20 blur-3xl delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-linear-to-r from-emerald-300 to-purple-300 opacity-10 blur-3xl delay-500"></div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          {/* Logo/Header Section */}
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <div className="relative overflow-hidden rounded-full">
                <div className="flex h-full w-full items-center justify-center">
                  <Logo className="size-36 text-white" />
                </div>
              </div>
            </div>
            {/* <h1 className="mb-2 text-3xl font-bold text-gray-800">Quantum Social Club</h1> */}
            <p className="text-base text-gray-600">Your Premier Sports & Social Destination</p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            {links.map((link, index) => {
              const Icon = link.icon;
              const LinkComponent = link.external ? 'a' : Link;
              const linkProps = link.external
                ? { href: link.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: link.href };

              return (
                <LinkComponent key={index} {...linkProps} className="block">
                  <Card className="group transform cursor-pointer border-0 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                    <div className="flex items-center gap-4 px-4 py-0">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${link.color} shadow-md transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="size-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="group-hover:text-primary mb-1 text-lg font-semibold text-gray-800 transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">{link.description}</p>
                      </div>
                      <svg
                        className="h-6 w-6 shrink-0 text-gray-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Card>
                </LinkComponent>
              );
            })}
          </div>

          {/* Footer Section */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm text-gray-600">Follow us on social media</p>
            <div className="flex justify-center gap-4">
              <a
                href="https://www.instagram.com/quantumsportsandsocialclub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-md transition-all hover:scale-110 hover:bg-linear-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white"
              >
                <IconBrandInstagram className="size-7" strokeWidth={1.8} />
              </a>
              <a
                href={getWhatsappMessageUrl(
                  '+6282311160880',
                  'Halo Quantum Social Club! Saya ingin menghubungi customer service.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-primary flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-md transition-all hover:scale-110 hover:text-white"
              >
                <IconBrandWhatsapp className="size-7" strokeWidth={1.8} />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              © 2025 Quantum Social Club. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
