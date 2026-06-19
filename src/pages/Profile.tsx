import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfileStats } from '../services/db';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ArrowLeft, Flame, Award, Calendar, RefreshCw, User as UserIcon, Sparkles, Check } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch } = useProfileStats(user?.id);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('');
  const [goalType, setGoalType] = useState<'lose_weight' | 'maintain' | 'gain_weight'>('maintain');
  const [targetWeight, setTargetWeight] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url || '');
      setCalorieGoal(profile.daily_calorie_goal ? String(profile.daily_calorie_goal) : '');
      setGoalType(profile.goal_type || 'maintain');
      setTargetWeight(profile.target_weight ? String(profile.target_weight) : '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setSuccessMsg(false);

    const goalVal = calorieGoal.trim() ? parseInt(calorieGoal) : null;
    const weightVal = targetWeight.trim() ? parseFloat(targetWeight) : null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: avatarUrl.trim() || null,
          daily_calorie_goal: goalVal,
          goal_type: goalType,
          target_weight: weightVal
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      await refetch();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center font-sans font-bold text-brand-primary">
        Loading profile stats...
      </div>
    );
  }

  const initials = profile?.username?.substring(0, 2).toUpperCase() || 'U';
  const currentStreak = stats?.streak?.current_streak || 0;
  const longestStreak = stats?.streak?.longest_streak || 0;
  const totalLogs = stats?.totalLogs || 0;

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-brand-text pb-20">
      {/* Navigation Header */}
      <header className="border-b-[3.5px] border-brand-primary bg-white py-4 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 border-2 border-brand-primary rounded-full hover:bg-[#F8F4EF] transition-all text-brand-primary cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <span className="font-display font-black text-2xl tracking-tighter text-brand-primary select-none">
            FITCLUB
          </span>
        </div>
      </header>

      {/* Profile Info & Stats */}
      <main className="max-w-[760px] mx-auto px-6 mt-12">
        <Card hoverable={false} className="border-[3.5px] p-8 bg-white mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b-[3px] border-brand-primary/10">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username} 
                className="w-20 h-20 rounded-full border-[3px] border-brand-primary object-cover shadow-[3px_3px_0_0_#6D001F]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-accent text-white border-[3px] border-brand-primary flex items-center justify-center text-2xl font-black shadow-[3px_3px_0_0_#6D001F]">
                {initials}
              </div>
            )}
            
            <div className="text-center sm:text-left">
              <h2 className="font-display font-black text-3xl text-brand-primary tracking-tight">
                {profile?.username}
              </h2>
              <p className="text-xs font-bold text-brand-primary/50 uppercase tracking-widest mt-1">
                FitClub Champion since {new Date(profile?.created_at || '').toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Core metrics grids */}
          <div className="grid grid-cols-3 gap-4 py-8">
            <div className="text-center p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-brand-accent">
                <Flame className={`w-6 h-6 ${currentStreak > 0 ? 'fill-brand-accent' : ''}`} />
              </div>
              <span className="block font-display font-black text-3xl text-brand-primary font-mono leading-tight">
                {currentStreak}
              </span>
              <span className="text-[10px] font-black text-brand-primary/50 uppercase tracking-wider">
                Current Streak
              </span>
            </div>

            <div className="text-center p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-[#FFB000]">
                <Award className="w-6 h-6 fill-[#FFB000]/20" />
              </div>
              <span className="block font-display font-black text-3xl text-brand-primary font-mono leading-tight">
                {longestStreak}
              </span>
              <span className="text-[10px] font-black text-brand-primary/50 uppercase tracking-wider">
                Longest Streak
              </span>
            </div>

            <div className="text-center p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-brand-primary/60">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="block font-display font-black text-3xl text-brand-primary font-mono leading-tight">
                {totalLogs}
              </span>
              <span className="text-[10px] font-black text-brand-primary/50 uppercase tracking-wider">
                Total Logs
              </span>
            </div>
          </div>

          {/* Details form */}
          <form onSubmit={handleUpdateProfile} className="space-y-5 pt-4 border-t border-brand-primary/10">
            <h3 className="font-display font-black text-lg text-brand-primary">
              Profile Settings
            </h3>

            {successMsg && (
              <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl text-xs font-bold text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                  Daily Calorie Goal (kcal)
                </label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(e.target.value)}
                  placeholder="e.g. 2200"
                  min={1}
                  className="block w-full px-3 py-2.5 border-[2.5px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                  Goal Type
                </label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="block w-full px-3 py-2.5 border-[2.5px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
                >
                  <option value="lose_weight">Fat Loss (Lose Weight)</option>
                  <option value="maintain">Maintenance (Maintain)</option>
                  <option value="gain_weight">Muscle Gain (Gain Weight)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                  Target Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="e.g. 75.5"
                  min={1}
                  className="block w-full px-3 py-2.5 border-[2.5px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
                />
              </div>
            </div>

            {/* Goal Explanations */}
            <div className="bg-[#F8F4EF]/60 border-2 border-brand-primary/10 rounded-2xl p-4 text-xs font-bold text-brand-primary/70 space-y-2">
              <span className="block font-display font-black text-brand-primary uppercase tracking-wider text-[10px]">
                Goal Strategy Guide
              </span>
              {goalType === 'lose_weight' && (
                <p>
                  🎯 **Fat Loss Strategy**: Eat below your maintenance calories (typically a 300-500 kcal deficit). Track your calorie logs closely to stay consistent and match your daily target.
                </p>
              )}
              {goalType === 'maintain' && (
                <p>
                  🎯 **Maintenance Strategy**: Eat exactly at your maintenance calories to support energy balance and weight stability. Perfect for building consistent daily calorie tracking habits.
                </p>
              )}
              {goalType === 'gain_weight' && (
                <p>
                  🎯 **Muscle Gain Strategy**: Eat in a moderate calorie surplus (typically 200-400 kcal surplus) paired with active training. Stay accountable with daily logs to hit your goals.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="block w-full px-3 py-2.5 border-[2.5px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                className="py-2 px-6 text-sm"
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
