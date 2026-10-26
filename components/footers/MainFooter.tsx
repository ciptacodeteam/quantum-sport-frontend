'use client';

import LogoImage from '@/assets/img/logoblack.webp';
import { clubLocations } from '@/lib/club-locations';
import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import BranchLink from '@/components/branches/BranchLink';

const menuItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Padel', href: '/booking' },
  { label: 'Tennis', href: '/booking/tennis' },
  { label: 'Value Pack', href: '/membership' },
  { label: 'Riwayat', href: '/invoice', requiresAuth: true }
];

export default function MainFooter() {
  const { data: user } = useQuery(profileQueryOptions);
  const openAuthModal = useAuthModalStore((state) => state.open);
  const linkClassName =
    'transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black';

  return (
    <footer className="hidden border-t border-black/10 bg-[#f8f8f6] text-sm leading-relaxed text-black/50 lg:block">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_1.2fr] lg:gap-16 lg:py-16">
        <div className="space-y-6 sm:col-span-2 lg:col-span-1">
          <BranchLink href="/" aria-label="Black Padel — Beranda" className="inline-block">
            <Image src={LogoImage} alt="Black Padel" sizes="144px" className="h-auto w-36" />
          </BranchLink>
          <p className="max-w-xs">Book courts and manage your padel activities in one place.</p>
          <address className="max-w-xs not-italic">{clubLocations[0].address}</address>
          <address className="max-w-xs not-italic">
            <a
              href="https://maps.google.com/maps?vet=10CAAQoqAOahcKEwjwxdOnoM2XAxUAAAAAHQAAAAAQBQ..i&udm&fvr=1&pvq=Cg0vZy8xMXkwcDkxeTFoIhEKC2JsYWNrIHBhZGVsEAIYAw&lqi=CgtibGFjayBwYWRlbEiv6MPUgr2AgAhaExAAEAEYASILYmxhY2sgcGFkZWySAQtwYWRlbF9jb3VydA&cs=1&um=1&ie=UTF-8&fb=1&gl=id&sa=X&ftid=0x3031310010a25ae9:0x14bf370c5ed5f418"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {clubLocations[1].address}
            </a>
          </address>
        </div>

        <nav aria-label="Menu footer">
          <h2 className="mb-5 text-xs font-semibold tracking-[0.08em] text-[#ad422b] uppercase">
            Menu
          </h2>
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.href}>
                {item.requiresAuth && !user?.id ? (
                  <button type="button" className={linkClassName} onClick={openAuthModal}>
                    {item.label}
                  </button>
                ) : (
                  <BranchLink href={item.href} className={linkClassName}>
                    {item.label}
                  </BranchLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <h2 className="mb-5 text-xs font-semibold tracking-[0.08em] text-[#ad422b] uppercase">
            Contact
          </h2>
          <address className="space-y-4 not-italic">
            <p>
              Email:{' '}
              <a
                href="mailto:quantumsportsandsocialclub@gmail.com"
                className={`${linkClassName} break-words text-[#ad422b]`}
              >
                quantumsportsandsocialclub@gmail.com
              </a>
            </p>
            <p>
              WhatsApp:{' '}
              <a
                href="https://wa.me/628131626241"
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClassName} text-[#ad422b]`}
              >
                +62 813-1626-241
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-black/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            ©{new Date().getFullYear()} Black Padel. All Rights Reserved. Designed &amp; Developed
            by <span className="font-medium text-black/75">Cosinus</span>.
          </p>
          <BranchLink href="/terms-and-conditions" className={linkClassName}>
            Terms &amp; Conditions
          </BranchLink>
        </div>
      </div>
    </footer>
  );
}
