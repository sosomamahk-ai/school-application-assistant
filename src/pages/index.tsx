import Head from 'next/head';
import Link from 'next/link';
import { GraduationCap, FileText, Sparkles, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>School Application Assistant - AI-Powered Application Helper</title>
        <meta name="description" content="Simplify your school applications with AI assistance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">Application Assistant</span>
              </div>
              <div className="flex space-x-4">
                <Link href="/auth/login" className="text-gray-700 hover:text-primary-600 font-medium">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Your AI-Powered School Application Assistant
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Simplify the application process with intelligent form filling, personalized guidance, 
              and AI-generated essays. Apply to your dream schools with confidence.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                Start Your Application
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Auto-Fill</h3>
              <p className="text-gray-600">
                Automatically populate application forms with your saved profile information
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Sparkles className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Guidance</h3>
              <p className="text-gray-600">
                Get real-time assistance and explanations for every field you need to fill
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <GraduationCap className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Essay Generation</h3>
              <p className="text-gray-600">
                Create compelling essays and personal statements with AI-powered drafts
              </p>
            </div>

            <div className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Schools</h3>
              <p className="text-gray-600">
                Apply to multiple schools efficiently with reusable profile data
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-gray-600">
                  Fill in your basic information, education history, and experiences once
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Select Your Schools</h3>
                <p className="text-gray-600">
                  Choose the schools and programs you want to apply to from our templates
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Complete with AI Help</h3>
                <p className="text-gray-600">
                  Let AI guide you through each field and generate compelling content
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of students who have simplified their application process
            </p>
            <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-3 px-8 rounded-lg text-lg inline-block transition-colors duration-200">
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-semibold">Application Assistant</span>
              </div>
              <p className="text-gray-400">
                © 2024 School Application Assistant. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

