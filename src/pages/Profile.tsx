import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfileStats } from '../services/db';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { 
  ArrowLeft, 
  Flame, 
  Award, 
  Calendar, 
  RefreshCw, 
  User as UserIcon, 
  Sparkles, 
  Check,
  ChevronDown,
  ChevronUp,
  BarChart2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const formatGroupDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }
    return d.toLocaleDateString(undefined, options);
  }
};

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface MealLogItem {
  created_at: string;
  food_name: string;
  calories: number;
}

interface GroupedDay {
  dateString: string;
  formattedDate: string;
  totalCalories: number;
  mealsCount: number;
  meals: MealLogItem[];
}

const groupLogsByDate = (logs: MealLogItem[]): GroupedDay[] => {
  const groups: Record<string, GroupedDay> = {};

  logs.forEach(log => {
    const d = new Date(log.created_at);
    const dateKey = d.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        dateString: dateKey,
        formattedDate: formatGroupDate(log.created_at),
        totalCalories: 0,
        mealsCount: 0,
        meals: []
      };
    }
    
    groups[dateKey].totalCalories += log.calories;
    groups[dateKey].mealsCount += 1;
    groups[dateKey].meals.push(log);
  });

  return Object.values(groups).sort((a, b) => {
    const timeA = new Date(a.meals[0].created_at).getTime();
    const timeB = new Date(b.meals[0].created_at).getTime();
    return timeB - timeA;
  });
};

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, refetch } = useProfileStats(user?.id);

  // Calorie History Query & State
  const { data: userLogs, isLoading: loadingLogs } = useQuery<MealLogItem[]>({
    queryKey: ['user-meal-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('meal_logs')
        .select('created_at, food_name, calories')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MealLogItem[];
    },
    enabled: !!user?.id,
  });

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleExpand = (dateString: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateString]: !prev[dateString]
    }));
  };

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

  // Dynamic statistics calculations
  const logs = userLogs || [];
  const totalMeals = logs.length;
  const totalCalories = logs.reduce((sum, log) => sum + log.calories, 0);

  const distinctDays = new Set(logs.map(log => new Date(log.created_at).toDateString()));
  const distinctDaysCount = distinctDays.size;
  const avgDailyCalories = distinctDaysCount > 0 ? Math.round(totalCalories / distinctDaysCount) : 0;

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-brand-text pb-20">
      {/* Navigation Header */}
      <header className="border-b-[3.5px] border-brand-primary bg-white py-4 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-4">
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
      <main className="max-w-[760px] mx-auto px-4 sm:px-6 mt-12">
        <Card hoverable={false} className="border-[3.5px] p-5 sm:p-8 bg-white mb-8">
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
          <div className="grid grid-cols-3 gap-2 sm:gap-4 py-6 sm:py-8">
            <div className="text-center p-2 sm:p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-brand-accent">
                <Flame className={`w-5 h-5 sm:w-6 sm:h-6 ${currentStreak > 0 ? 'fill-brand-accent' : ''}`} />
              </div>
              <span className="block font-display font-black text-xl sm:text-3xl text-brand-primary font-mono leading-tight">
                {currentStreak}
              </span>
              <span className="text-[8px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block">
                Current Streak
              </span>
            </div>

            <div className="text-center p-2 sm:p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-[#FFB000]">
                <Award className={`w-5 h-5 sm:w-6 sm:h-6 ${longestStreak > 0 ? 'fill-[#FFB000]/20' : ''}`} />
              </div>
              <span className="block font-display font-black text-xl sm:text-3xl text-brand-primary font-mono leading-tight">
                {longestStreak}
              </span>
              <span className="text-[8px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block">
                Longest Streak
              </span>
            </div>

            <div className="text-center p-2 sm:p-4 bg-[#F8F4EF]/50 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-brand-primary/60">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="block font-display font-black text-xl sm:text-3xl text-brand-primary font-mono leading-tight">
                {totalLogs}
              </span>
              <span className="text-[8px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block">
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

        {/* Feature 3 — Lifetime Statistics */}
        <Card hoverable={false} className="border-[3.5px] p-5 sm:p-8 bg-white mb-8">
          <h3 className="font-display font-black text-xl text-brand-primary mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-accent" />
            Lifetime Statistics
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-[#F8F4EF]/55 rounded-2xl border-2 border-brand-primary/10">
              <span className="block font-display font-black text-xl sm:text-2xl text-brand-primary font-mono leading-tight">
                {totalMeals}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block mt-1">
                Meals Logged
              </span>
            </div>

            <div className="text-center p-3 sm:p-4 bg-[#F8F4EF]/55 rounded-2xl border-2 border-brand-primary/10">
              <span className="block font-display font-black text-xl sm:text-2xl text-brand-primary font-mono leading-tight">
                {totalCalories.toLocaleString()}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block mt-1">
                Calories Logged
              </span>
            </div>

            <div className="text-center p-3 sm:p-4 bg-[#F8F4EF]/55 rounded-2xl border-2 border-brand-primary/10">
              <span className="block font-display font-black text-xl sm:text-2xl text-brand-primary font-mono leading-tight">
                {avgDailyCalories.toLocaleString()}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-brand-primary/50 uppercase tracking-wider block mt-1">
                Avg Daily kcal
              </span>
            </div>

            <div className="text-center p-3 sm:p-4 bg-[#F8F4EF]/55 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-brand-accent">
                <Flame className={`w-4 h-4 sm:w-5 sm:h-5 ${currentStreak > 0 ? 'fill-brand-accent' : ''}`} />
              </div>
              <span className="block font-display font-black text-lg sm:text-xl text-brand-primary font-mono leading-tight">
                {currentStreak}d
              </span>
              <span className="text-[8px] sm:text-[9px] font-black text-brand-primary/50 uppercase tracking-wider block mt-0.5">
                Current Streak
              </span>
            </div>

            <div className="text-center p-3 sm:p-4 bg-[#F8F4EF]/55 rounded-2xl border-2 border-brand-primary/10">
              <div className="flex justify-center mb-1 text-[#FFB000]">
                <Award className={`w-4 h-4 sm:w-5 sm:h-5 ${longestStreak > 0 ? 'fill-[#FFB000]/20' : ''}`} />
              </div>
              <span className="block font-display font-black text-lg sm:text-xl text-brand-primary font-mono leading-tight">
                {longestStreak}d
              </span>
              <span className="text-[8px] sm:text-[9px] font-black text-brand-primary/50 uppercase tracking-wider block mt-0.5">
                Best Streak
              </span>
            </div>
          </div>
        </Card>

        {/* Feature 1 & 2 — Calorie History */}
        <Card hoverable={false} className="border-[3.5px] p-5 sm:p-8 bg-white mb-8">
          <h3 className="font-display font-black text-xl text-brand-primary mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-accent" />
            Calorie History
          </h3>

          {loadingLogs ? (
            <div className="py-8 text-center text-brand-primary/50 font-bold text-sm">
              Loading calorie history...
            </div>
          ) : logs.length === 0 ? (
            <div className="border-[3px] border-dashed border-brand-primary/20 rounded-[24px] p-8 text-center bg-white/50">
              <p className="text-sm font-bold text-brand-primary/60">
                No logs recorded yet. Start tracking to see your calorie history!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupLogsByDate(logs).map((day) => {
                const isExpanded = !!expandedDays[day.dateString];
                return (
                  <div 
                    key={day.dateString} 
                    className="border-[3.5px] border-brand-primary rounded-2xl overflow-hidden transition-all bg-white shadow-[2px_2px_0_0_#6D001F]"
                  >
                    {/* Day Header Summary */}
                    <button 
                      type="button"
                      onClick={() => toggleExpand(day.dateString)}
                      className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none"
                    >
                      <div>
                        <span className="font-display font-black text-sm sm:text-base text-brand-primary">
                          {day.formattedDate}
                        </span>
                        <span className="block text-[10px] font-bold text-brand-primary/50 mt-0.5">
                          {day.mealsCount} {day.mealsCount === 1 ? 'meal' : 'meals'} logged
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-xs sm:text-sm text-brand-primary bg-[#F8F4EF] border-2 border-brand-primary px-3 py-1 rounded-full">
                          {day.totalCalories} kcal
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4.5 h-4.5 text-brand-primary/70 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5 text-brand-primary/70 shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {/* Expanded Daily Details */}
                    {isExpanded && (
                      <div className="border-t-[3px] border-brand-primary bg-[#F8F4EF]/30 p-4 space-y-3">
                        {day.meals.map((meal, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center text-xs font-semibold py-2 border-b border-brand-primary/10 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0 flex-1 pr-4">
                              <span className="text-[10px] font-bold text-brand-primary/50 font-mono block">
                                {formatTime(meal.created_at)}
                              </span>
                              <span className="text-brand-text font-black block mt-0.5 truncate">
                                {meal.food_name}
                              </span>
                            </div>
                            <span className="font-mono font-black text-brand-primary shrink-0">
                              {meal.calories} kcal
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
