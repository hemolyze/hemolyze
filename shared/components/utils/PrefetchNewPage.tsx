'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A client component that prefetches the /new page on mount.
 * Renders nothing.
 */
export function PrefetchNewPage() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch the new page route when the component mounts
    // This component is only rendered when the user is signed in (see Header.tsx)
    router.prefetch('/new');
  }, [router]); // Dependency array ensures this runs only once on mount

  return null; // This component does not render anything visible
} 