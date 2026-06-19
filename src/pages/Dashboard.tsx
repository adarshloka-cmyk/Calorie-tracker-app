import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserClubs, useCreateClub, useJoinClub } from '../services/db';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Plus, Users, Compass, LogOut, User as UserIcon, Flame, Trophy } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: clubs, isLoading } = useUserClubs(user?.id);
  const createClubMutation = useCreateClub();
  const joinClubMutation = useJoinClub();

  // Create Club Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubEmoji, setClubEmoji] = useState('🏃');

  // Join Club Form State
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Common emojis list for clubs
  const emojis = ['🏃', '💪', '🥗', '🍎', '🏋️', '🚴', '🍕', '🍳', '🥑', '🏆', '🔥', '🥦'];

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreateError(null);

    if (!clubName.trim()) {
      setCreateError('Club name is required');
      return;
    }

    try {
      const newClub = await createClubMutation.mutateAsync({
        name: clubName.trim(),
        emoji: clubEmoji,
        userId: user.id
      });
      setShowCreateModal(false);
      setClubName('');
      navigate(`/club/${newClub.id}`);
    } catch (err: any) {
      console.error(err);
      setCreateError(err.message || 'Failed to create club. Please try again.');
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setJoinError(null);

    if (!inviteCode.trim()) {
      setJoinError('Invite code is required');
      return;
    }

    setIsJoining(true);
    try {
      const club = await joinClubMutation.mutateAsync({
        inviteCode: inviteCode.trim(),
        userId: user.id
      });
      setInviteCode('');
      navigate(`/club/${club.id}`);
    } catch (err: any) {
      console.error(err);
      setJoinError(err.message || 'Failed to join club. Check your code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-brand-text pb-20">
      {/* Header Navigation */}
      <header className="border-b-[3.5px] border-brand-primary bg-white py-4 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="font-display font-black text-2xl tracking-tighter text-brand-primary">
              FITCLUB
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/profile')} 
              className="flex items-center gap-2 px-4 py-2 border-2 border-brand-primary rounded-full hover:bg-[#F8F4EF] transition-all text-xs font-black text-brand-primary"
            >
              <UserIcon className="w-4 h-4" />
              <span>{profile?.username}</span>
            </button>
            <button 
              onClick={signOut}
              className="p-2.5 border-2 border-brand-primary rounded-full hover:bg-red-50 transition-all text-brand-primary"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-[1280px] mx-auto px-6 mt-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-brand-primary tracking-tight">
              Welcome back, {profile?.username}.
            </h1>
            <p className="text-sm font-bold text-brand-primary/60 mt-1">
              Stay accountable. Keep logging calories with friends.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <Button 
              variant="primary" 
              className="py-2.5 px-6 text-sm flex-1 md:flex-initial"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4.5 h-4.5 mr-1" />
              <span>Create Club</span>
            </Button>
          </div>
        </div>

        {/* Join Club Box & Clubs Listing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Clubs List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display font-black text-2xl text-brand-primary">
              Your Active Clubs
            </h2>

            {isLoading ? (
              <div className="py-12 text-center text-brand-primary/50 font-bold">
                Loading your clubs...
              </div>
            ) : !clubs || clubs.length === 0 ? (
              <Card hoverable={false} className="border-[3.5px] p-8 text-center bg-white">
                <Compass className="w-12 h-12 text-brand-accent mx-auto mb-4" />
                <h3 className="font-display font-black text-xl text-brand-primary mb-2">
                  No clubs joined yet!
                </h3>
                <p className="text-sm font-bold text-brand-primary/60 mb-6 max-w-sm mx-auto">
                  Diets fail when logged alone. Create your own private club or join one using an invite code.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="primary" className="py-2 text-sm" onClick={() => setShowCreateModal(true)}>
                    Create Club
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {clubs.map((club) => (
                  <Card 
                    key={club.id} 
                    className="cursor-pointer border-[3.5px] p-6 hover:shadow-[6px_6px_0_0_#6D001F] transition-all flex flex-col justify-between h-[160px]"
                    onClick={() => navigate(`/club/${club.id}`)}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl" role="img" aria-label="club emoji">
                          {club.emoji}
                        </span>
                        <h3 className="font-display font-black text-xl text-brand-primary line-clamp-1">
                          {club.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
                        Invite Code: <span className="font-mono text-brand-accent">{club.invite_code}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-black text-brand-primary border-t border-brand-primary/10 pt-4 mt-auto">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Feed & Leaderboard</span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Join Club sidebar */}
          <div className="space-y-6">
            <h2 className="font-display font-black text-2xl text-brand-primary">
              Join with Code
            </h2>

            <Card hoverable={false} className="border-[3.5px] p-6 bg-white">
              <h3 className="font-display font-black text-lg text-brand-primary mb-2">
                Have an Invite?
              </h3>
              <p className="text-xs font-bold text-brand-primary/60 mb-5 leading-relaxed">
                Enter a 7-character invite code below to instantly join your friend's club feed.
              </p>

              {joinError && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-brand-secondary/20 rounded-xl text-xs font-bold text-brand-secondary">
                  {joinError}
                </div>
              )}

              <form onSubmit={handleJoinClub} className="space-y-4">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="ABCD123"
                  maxLength={7}
                  className="block w-full text-center tracking-widest uppercase font-mono font-black text-xl py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 bg-[#F8F4EF]/50 placeholder-brand-primary/20"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full py-2.5 text-sm"
                  disabled={isJoining}
                >
                  {isJoining ? 'Joining...' : 'Join Club'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {/* Create Club Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card hoverable={false} className="w-full max-w-md border-[3.5px] p-6 bg-white relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display font-black text-2xl text-brand-primary mb-4">
              Create a Club
            </h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-brand-secondary/20 rounded-xl text-xs font-bold text-brand-secondary">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClub} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-brand-primary uppercase tracking-wider mb-2">
                  Club Emoji
                </label>
                <div className="grid grid-cols-6 gap-2 bg-[#F8F4EF]/50 p-3 rounded-xl border-2 border-brand-primary/20">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setClubEmoji(emoji)}
                      className={`text-2xl p-1.5 rounded-lg transition-transform hover:scale-110 flex items-center justify-center ${
                        clubEmoji === emoji 
                          ? 'border-2 border-brand-accent bg-white scale-105' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-brand-primary uppercase tracking-wider mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  required
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Sunday Runners"
                  className="block w-full px-3 py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/50 placeholder-brand-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 py-2 text-sm text-brand-primary border border-brand-primary/10"
                  onClick={() => {
                    setShowCreateModal(false);
                    setClubName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-2 text-sm"
                  disabled={createClubMutation.isPending}
                >
                  {createClubMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
