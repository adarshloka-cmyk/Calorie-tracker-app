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
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="font-display font-black text-2xl tracking-tighter text-brand-primary hover:opacity-90 transition-opacity">
              FITCLUB
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/profile')} 
              className="flex items-center gap-2 px-4 py-2 border-2 border-brand-primary rounded-full hover:bg-brand-primary hover:text-white transition-all duration-200 text-xs font-black text-brand-primary cursor-pointer"
            >
              <UserIcon className="w-4 h-4" />
              <span>{profile?.username}</span>
            </button>
            <button 
              onClick={signOut}
              className="p-2.5 border-2 border-brand-primary rounded-full hover:bg-brand-secondary hover:text-white transition-all duration-200 text-brand-primary cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 mt-8 sm:mt-12">
        {/* Welcome Section */}
        <div className="border-b-[3px] border-brand-primary/10 pb-8 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-1.5">
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-brand-primary tracking-tight leading-tight">
              Welcome back, {profile?.username}.
            </h1>
            <p className="text-sm sm:text-base font-bold text-brand-primary/60">
              Stay accountable. Keep logging calories with friends.
            </p>
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="primary" 
              className="py-2.5 px-6 text-sm flex-1 sm:flex-initial"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4.5 h-4.5 mr-1" />
              <span>Create Club</span>
            </Button>
          </div>
        </div>

        {/* Join Club Box & Clubs Listing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
          {/* Clubs List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display font-black text-xl sm:text-2xl text-brand-primary tracking-tight">
              Your Active Clubs
            </h2>

            {isLoading ? (
              <div className="py-12 text-center text-brand-primary/50 font-bold">
                Loading your clubs...
              </div>
            ) : !clubs || clubs.length === 0 ? (
              <Card hoverable={false} className="border-[3.5px] p-8 sm:p-10 text-center bg-white shadow-[4px_4px_0_0_#6D001F] rounded-[24px]">
                <Compass className="w-12 h-12 text-brand-accent mx-auto mb-4" />
                <h3 className="font-display font-black text-xl text-brand-primary mb-2">
                  No clubs joined yet!
                </h3>
                <p className="text-sm font-bold text-brand-primary/60 mb-6 max-w-sm mx-auto leading-relaxed">
                  Diets fail when logged alone. Create your own private club or join one using an invite code.
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" className="py-2.5 px-6 text-sm" onClick={() => setShowCreateModal(true)}>
                    Create Club
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {clubs.map((club) => (
                  <Card 
                    key={club.id} 
                    className="group cursor-pointer border-[3.5px] p-6 hover:shadow-[6px_6px_0_0_#6D001F] transition-all duration-200 flex flex-col justify-between min-h-[170px] h-auto rounded-[24px] bg-white"
                    onClick={() => navigate(`/club/${club.id}`)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl bg-[#F8F4EF] border-[2.5px] border-brand-primary rounded-xl shadow-[2px_2px_0_0_#6D001F]" role="img" aria-label="club emoji">
                          {club.emoji}
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <h3 className="font-display font-black text-lg sm:text-xl text-brand-primary line-clamp-1 leading-tight group-hover:text-brand-secondary transition-colors duration-200">
                            {club.name}
                          </h3>
                          <p className="text-[11px] font-black text-brand-primary/40 uppercase tracking-wider mt-1.5">
                            Invite Code: <span className="font-mono font-black text-brand-accent tracking-normal">{club.invite_code}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-black text-brand-primary border-t border-brand-primary/10 pt-4 mt-6">
                      <span className="flex items-center gap-2 text-brand-primary/70 group-hover:text-brand-primary transition-colors duration-200">
                        <Users className="w-4 h-4" />
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
            <h2 className="font-display font-black text-xl sm:text-2xl text-brand-primary tracking-tight">
              Join with Code
            </h2>

            <Card hoverable={false} className="border-[3.5px] p-6 bg-white shadow-[4px_4px_0_0_#6D001F] rounded-[24px]">
              <h3 className="font-display font-black text-lg text-brand-primary mb-2">
                Have an Invite?
              </h3>
              <p className="text-xs font-bold text-brand-primary/60 mb-5 leading-relaxed">
                Enter a 7-character invite code below to instantly join your friend's club feed.
              </p>

              {joinError && (
                <div className="mb-4 p-3.5 bg-red-50 border-2 border-brand-secondary/20 rounded-xl text-xs font-bold text-brand-secondary leading-relaxed">
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
                  className="block w-full text-center tracking-widest uppercase font-mono font-black text-xl py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:border-brand-accent focus:bg-white transition-all duration-200 bg-[#F8F4EF]/50 placeholder-brand-primary/20"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full py-3 text-sm transition-all duration-200"
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
          <Card hoverable={false} className="w-full max-w-md border-[3.5px] p-6 sm:p-8 bg-white relative animate-in fade-in zoom-in-95 duration-150 shadow-[6px_6px_0_0_#6D001F] rounded-[24px]">
            <h3 className="font-display font-black text-2xl text-brand-primary mb-4">
              Create a Club
            </h3>

            {createError && (
              <div className="mb-4 p-3.5 bg-red-50 border-2 border-brand-secondary/20 rounded-xl text-xs font-bold text-brand-secondary leading-relaxed">
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
                      className={`text-2xl p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
                        clubEmoji === emoji 
                          ? 'border-[2px] border-brand-primary bg-white shadow-[2px_2px_0_0_#FF6B00] scale-105 opacity-100' 
                          : 'border-[2px] border-transparent opacity-70 hover:opacity-100 hover:scale-110'
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
                  className="block w-full px-4 py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:border-brand-accent focus:bg-white transition-all duration-200 text-sm font-bold bg-[#F8F4EF]/50 placeholder-brand-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 py-2.5 text-sm text-brand-primary border-2 border-brand-primary/10 hover:border-brand-primary/30 transition-all duration-200"
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
                  className="flex-1 py-2.5 text-sm"
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
