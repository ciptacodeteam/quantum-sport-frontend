import LogoImage from '@/aseets/img/logo.svg';
import Link from 'next/link';
import LoginModalButton from '../buttons/LoginModalButton';

const MainHeader = () => {
  return (
    <header className="flex-center top-0 left-0 z-50 min-h-20 w-full bg-white shadow-sm md:fixed">
      <div className="mx-auto w-full max-w-7xl px-4">
        <main className="flex-between gap-4">
          <Link href="/" prefetch>
            <div className="flex-center relative my-2 h-16 w-28 md:w-32">
              <LogoImage className="absolute inset-0 h-full w-full object-contain" />
            </div>
          </Link>

          <div className="flex items-center justify-end gap-4">
            <LoginModalButton />
          </div>
        </main>
      </div>
    </header>
  );
};
export default MainHeader;
