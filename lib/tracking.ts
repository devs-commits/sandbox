// lib/tracking.ts

export const setReferralCookies = (refCode: string | null, squadSlug: string | null) => {
  if (typeof window === 'undefined') return;

  // Set cookies to expire in 30 days
  const expires = new Date();
  expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiresString = `expires=${expires.toUTCString()}`;

  if (refCode) {
    document.cookie = `wdc_ref=${refCode};${expiresString};path=/`;
  }
  
  if (squadSlug) {
    document.cookie = `wdc_squad=${squadSlug};${expiresString};path=/`;
  }
};

export const getReferralCookies = () => {
  if (typeof window === 'undefined') return { refCode: null, squadSlug: null };

  const getCookieValue = (name: string) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  return {
    refCode: getCookieValue('wdc_ref'),
    squadSlug: getCookieValue('wdc_squad'),
  };
};

export const clearReferralCookies = () => {
  if (typeof window === 'undefined') return;
  document.cookie = "wdc_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "wdc_squad=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};