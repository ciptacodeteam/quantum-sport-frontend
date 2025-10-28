import { useState, useEffect } from 'react';

const useHideHeader = () => {
  const [isTop, setIsTop] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // track scroll with a local previous value to avoid stale closures
    let prev = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > prev && prev > 400) setVisible(false);
      else setVisible(true);
      prev = current;
      setIsTop(current === 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { isTop, visible };
};
export default useHideHeader;
