import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJoinClub } from '../services/db';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function JoinClub() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const joinClubMutation = useJoinClub();
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (loading) return;

    // 1. If unauthenticated, redirect to auth page with a redirect back to this join route
    if (!user) {
      navigate(`/auth?redirect=/join/${inviteCode}`);
      return;
    }

    // 2. If authenticated, trigger join club logic
    const executeJoin = async () => {
      if (!inviteCode) return;
      
      try {
        const club = await joinClubMutation.mutateAsync({
          inviteCode: inviteCode.trim().toUpperCase(),
          userId: user.id
        });
        setJoined(true);
        // Redirect to club page
        setTimeout(() => {
          navigate(`/club/${club.id}`);
        }, 1200);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to join the club. Check if the invite code is correct.');
      }
    };

    executeJoin();
  }, [user, loading, inviteCode, navigate]);

  return (
    <div className="min-h-screen bg-[#F8F4EF] flex flex-col justify-center items-center p-6 font-sans text-brand-text">
      <div className="w-full max-w-md">
        <Card hoverable={false} className="border-[3.5px] p-6 sm:p-8 text-center bg-white">
          <span className="text-4xl block mb-4">🏃</span>
          <h2 className="font-display font-black text-2xl text-brand-primary mb-3">
            Joining Club Feed
          </h2>

          {error ? (
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border-2 border-brand-secondary/30 rounded-xl flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-brand-secondary leading-snug">{error}</span>
              </div>
              <Button variant="primary" className="w-full py-2.5" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          ) : joined ? (
            <div className="py-4 space-y-2">
              <div className="text-brand-accent text-3xl animate-bounce">🎉</div>
              <p className="text-sm font-black text-brand-primary">Successfully joined club!</p>
              <p className="text-xs text-brand-primary/50 font-bold">Redirecting you to the feed...</p>
            </div>
          ) : (
            <div className="py-6 space-y-4">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-brand-primary/60">
                Adding you to the club members list...
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
