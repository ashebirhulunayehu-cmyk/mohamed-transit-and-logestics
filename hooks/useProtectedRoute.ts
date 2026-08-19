// hooks/useProtectedRoute.ts
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function useProtectedRoute(allowedRoles?: string[]) {
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || 'en';
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Initialize auth store from localStorage
    useAuthStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${lang}/login`);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'assessor') {
        router.push(`/${lang}/assessor/dashboard`);
      } else if (user.role === 'importer') {
        router.push(`/${lang}/importer/dashboard`);
      } else {
        router.push(`/${lang}/login`);
      }
    }
  }, [isAuthenticated, user, allowedRoles, router, lang]);

  return { isAuthenticated, user };
}
