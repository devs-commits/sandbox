import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "../app/contexts/AuthContexts";
import { Toaster } from "sonner";
import { Suspense } from "react"; // 🔥 Added Suspense
import { ReferralTracker } from "./components/ReferralTracker"; // 🔥 Import our new tracker (adjust path if needed)

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WDC Labs",
  description: "Start Building Experience. Get Hired. Join WDC Labs today and kickstart your tech career with real-world projects, expert mentorship, and a vibrant community.",
  icons: {
    icon: "/favicon.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager - Placed as high in the head as possible */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5PH5LGH3');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-5PH5LGH3"
            height="0" 
            width="0" 
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Paystack */}
        <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vqlbwl8l6x");
          `}
        </Script>

        <AuthProvider>
          {/* 🔥 INJECTED REFERRAL TRACKER */}
          <Suspense fallback={null}>
            <ReferralTracker />
          </Suspense>
          
          {children}
        </AuthProvider>
        
        <Toaster richColors position="top-center" />

      </body>
    </html>
  );
}