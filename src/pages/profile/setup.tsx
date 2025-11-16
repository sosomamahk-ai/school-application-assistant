import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { GraduationCap } from 'lucide-react';

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    router.push('/profile');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <Head>
        <title>Welcome - School Application Assistant</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <GraduationCap className="h-20 w-20 text-primary-600" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Application Assistant!
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            To get the most out of our AI-powered assistance, let&apos;s set up your profile first.
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Why complete your profile?
            </h2>

            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-bold">✓</span>
                </div>
                <p className="text-gray-700">
                  <strong>Auto-fill applications:</strong> Your information will automatically populate application forms
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-bold">✓</span>
                </div>
                <p className="text-gray-700">
                  <strong>Better AI assistance:</strong> Our AI will provide more personalized and relevant suggestions
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-sm font-bold">✓</span>
                </div>
                <p className="text-gray-700">
                  <strong>Save time:</strong> Enter your information once and reuse it for multiple applications
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleContinue}
              className="btn-primary text-lg px-8 py-3"
            >
              Set Up My Profile
            </button>
            <button
              onClick={handleSkip}
              className="btn-secondary text-lg px-8 py-3"
            >
              Skip for Now
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            You can always update your profile later from the dashboard
          </p>
        </div>
      </div>
    </>
  );
}

