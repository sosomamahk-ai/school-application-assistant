import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { useEffect } from 'react';
import { isWordPressEnvironment } from '@/utils/wordpress';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 检测WordPress环境并添加类名到body
    if (typeof window !== 'undefined' && isWordPressEnvironment()) {
      document.body.classList.add('wordpress-embed', 'wordpress-iframe');
    }
  }, []);

  return (
    <TranslationProvider>
      <Component {...pageProps} />
    </TranslationProvider>
  );
}

