'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from 'react-redux'
import { store } from './store'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Toaster } from 'sonner'
import { TranslationErrorBoundary } from '@/components/shared/TranslationErrorBoundary'
import { ViewTransitionsProvider } from '@/contexts/ViewTransitionsContext'
import { SwipeNavigationProvider } from '@/contexts/SwipeNavigationContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="application-name" content="CCC inventario" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CCC inventario" />
        <meta name="description" content="Sistema de gestión de inventario general" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#E30613" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#E30613" />

        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/claro-icon.svg" color="#E30613" />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://inventory.claro.com" />
        <meta name="twitter:title" content="CCC inventario" />
        <meta name="twitter:description" content="Sistema de gestión de inventario general" />
        <meta name="twitter:image" content="https://inventory.claro.com/icons/icon-192x192.png" />
        <meta name="twitter:creator" content="@claro" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CCC inventario" />
        <meta property="og:description" content="Sistema de gestión de inventario general" />
        <meta property="og:site_name" content="Claro Inventory" />
        <meta property="og:url" content="https://inventory.claro.com" />
        <meta property="og:image" content="https://inventory.claro.com/icons/icon-192x192.png" />

        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
        
        {/* Preload critical resources */}
        <link rel="preload" as="image" href="/images/materiales-reservas-background.jpg" />
        <link rel="preload" as="image" href="/images/solicitar-materiales-background.jpg" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ViewTransitionsProvider>
          <SwipeNavigationProvider>
            <ThemeProvider>
              <TranslationErrorBoundary>
                <LanguageProvider>
                  <Provider store={store}>
                    {children}
                    <Toaster 
                      position="top-center"
                      expand={true}
                      richColors
                      closeButton
                      toastOptions={{
                        style: {
                          background: 'var(--toast-bg)',
                          color: 'var(--toast-text)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          padding: '16px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        },
                        className: 'toast-sonner',
                      }}
                    />
                  </Provider>
                </LanguageProvider>
              </TranslationErrorBoundary>
            </ThemeProvider>
          </SwipeNavigationProvider>
        </ViewTransitionsProvider>
      </body>
    </html>
  );
}
