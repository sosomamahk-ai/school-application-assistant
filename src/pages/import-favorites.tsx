import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Loader2 } from 'lucide-react';

export default function ImportFavorites() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const importSchools = async () => {
      const { ids } = router.query;
      if (!ids) return;

      setStatus('Importing schools...');
      
      const wpIds = (ids as string).split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (wpIds.length === 0) {
        setStatus('No valid school IDs found.');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
            // Redirect to login if not logged in, passing return URL
            router.push(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
            return;
        }

        const response = await fetch('/api/applications/import-favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ wpIds })
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(`Import complete! Created: ${data.results.created}, Skipped: ${data.results.skipped}`);
          setTimeout(() => {
            router.push('/my-application');
          }, 1500);
        } else {
            const err = await response.json();
            setStatus(`Error: ${err.error || 'Import failed'}`);
        }
      } catch (error) {
        setStatus('An error occurred during import.');
        console.error(error);
      }
    };

    if (router.isReady) {
      importSchools();
    }
  }, [router.isReady, router.query, router]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h1 className="text-xl font-semibold text-gray-800">{status}</h1>
      </div>
    </Layout>
  );
}
