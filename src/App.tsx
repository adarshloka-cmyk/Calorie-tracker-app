import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Public Landing Page Components
import Navigation from './components/ui/Navigation';
import Hero from './sections/Hero';
import SocialCanvas from './sections/SocialCanvas';
import Features from './sections/Features';
import HowItWorks from './sections/HowItWorks';
import FinalCTA from './sections/FinalCTA';

// Application Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Club from './pages/Club';
import Profile from './pages/Profile';
import JoinClub from './pages/JoinClub';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center font-sans font-bold text-brand-primary">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Separate Landing Page Layout
function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center font-sans font-bold text-brand-primary">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#F8F4EF]">
      {/* Fixed Sticky Header Navbar */}
      <Navigation />

      {/* Main Snap scroll wrapper */}
      <div className="snap-container no-scrollbar">
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: Friends Competing Together */}
        <SocialCanvas />

        {/* Section 3: Accountability Made Fun */}
        <Features />

        {/* Section 4: How It Works */}
        <HowItWorks />

        {/* Section 5: Final CTA (with integrated footer) */}
        <FinalCTA />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Snapped Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth Page */}
            <Route path="/auth" element={<Auth />} />

            {/* Invite Links Auto-Join Route */}
            <Route path="/join/:inviteCode" element={<JoinClub />} />

            {/* Protected Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Protected Club View */}
            <Route 
              path="/club/:id" 
              element={
                <ProtectedRoute>
                  <Club />
                </ProtectedRoute>
              } 
            />

            {/* Protected User Profile */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Catch All Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
