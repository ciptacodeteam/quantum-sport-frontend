import { useEffect, useState } from 'react';

/** True after the component has mounted on the client. Use to defer browser-only state in SSR. */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
