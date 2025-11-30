'use client';

import { Card } from '@/components/ui/card';
import { getWhatsappMessageUrl } from '@/lib/utils';
import { IconBrandInstagram, IconBrandWhatsapp } from '@tabler/icons-react';
import { Calendar, FileText, Headphones, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

import Image from 'next/image';
import logowhite from '@/public/assets/img/logowhite.webp';

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
      href: 'https://drive.google.com/file/d/1hMqrGyzdt3w0nZS4J0pac5A53roTEHEJ/view?usp=sharing',
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
  // bg-[#09331e]
  return (
    <div className="overflow-hidde relative min-h-screen bg-[url(/assets/img/bg-court.webp)] bg-cover bg-center bg-no-repeat">
      <div className="relative z-10 container mx-auto px-4 pb-12">
        <div className="mx-auto max-w-2xl">
          {/* Logo/Header Section */}
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <div className="relative overflow-hidden mt-12">
                <div className="flex h-full w-full items-center justify-center">
                  <Image src={logowhite} alt="" className='w-42'/>
                </div>
              </div>
            </div>
            {/* <h1 className="mb-2 text-3xl font-bold text-gray-800">Quantum Social Club</h1> */}
            {/* <p className="text-base text-white">Your Premier Sports & Social Destination</p> */}
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
                  <Card className="group transform cursor-pointer border-0 bg-[#09331e] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                    <div className="flex items-center gap-4 px-4 py-0">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/80 transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="size-6 text-[#09331e]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="group-hover:text-primary text-lg font-semibold text-[#e0d5b7] transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-sm text-white">{link.description}</p>
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
          <div className="mt-6 text-center">
            <p className="mb-4 text-sm text-white">Follow us on social media</p>
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
          <div className="mt-6 text-center">
            <p className="text-xs text-white">©2025 Quantum Social Club. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
