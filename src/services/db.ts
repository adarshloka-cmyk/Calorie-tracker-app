import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { Club, Profile, MealLog, Reaction, Streak } from '../types';

// Helper to generate a random 7-character invite code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// -------------------------------------------------------------
// CLUBS
// -------------------------------------------------------------

// Fetch all clubs user is a member of
export const useUserClubs = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-clubs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          club_id,
          clubs (
            id,
            name,
            emoji,
            invite_code,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return (data || []).map((item: any) => item.clubs).filter(Boolean) as Club[];
    },
    enabled: !!userId,
  });
};

// Fetch details for a specific club
export const useClubDetails = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      if (!clubId) return null;
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (error) throw error;
      return data as Club;
    },
    enabled: !!clubId,
  });
};

// Create a new club (inserts club, generates code, and joins creator as member)
export const useCreateClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, emoji, userId }: { name: string; emoji: string; userId: string }) => {
      const inviteCode = generateInviteCode();
      
      // 1. Create the club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name,
          emoji,
          invite_code: inviteCode,
          owner_id: userId
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Add creator to club members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: userId
        });

      if (memberError) throw memberError;

      return club as Club;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-clubs', variables.userId] });
    }
  });
};

// Join a club using an invite code
export const useJoinClub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteCode, userId }: { inviteCode: string; userId: string }) => {
      // 1. Lookup the club by invite code
      const { data: club, error: lookupError } = await supabase
        .from('clubs')
        .select('*')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single();

      if (lookupError) throw new Error('Invalid invite code. Club not found.');

      // 2. Attempt to join
      const { error: joinError } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: userId
        });

      // Handle unique constraint check (already joined)
      if (joinError && joinError.code !== '23505') {
        throw joinError;
      }

      return club as Club;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-clubs', variables.userId] });
    }
  });
};

// -------------------------------------------------------------
// FEED & MEAL LOGS
// -------------------------------------------------------------

// Fetch the chronological feed of a club
export const useClubFeed = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ['club-feed', clubId],
    queryFn: async () => {
      if (!clubId) return [];
      
      // Fetch logs, profiles, reactions, and comments
      const { data, error } = await supabase
        .from('meal_logs')
        .select(`
          *,
          profiles (id, username, avatar_url, daily_calorie_goal, goal_type),
          reactions (
            id,
            emoji,
            user_id,
            profiles (id, username)
          ),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles (id, username, avatar_url)
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MealLog[];
    },
    enabled: !!clubId,
  });
};

// Add a meal log
export const useAddMealLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clubId, userId, foodName, calories, imageUrl }: {
      clubId: string;
      userId: string;
      foodName: string;
      calories: number;
      imageUrl?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('meal_logs')
        .insert({
          club_id: clubId,
          user_id: userId,
          food_name: foodName,
          calories,
          image_url: imageUrl || null
        })
        .select()
        .single();

      if (error) throw error;
      return data as MealLog;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-leaderboard', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', variables.userId] });
    }
  });
};

export const useUpdateMealLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, foodName, calories, clubId }: {
      id: string;
      foodName: string;
      calories: number;
      clubId: string;
    }) => {
      const { data, error } = await supabase
        .from('meal_logs')
        .update({
          food_name: foodName,
          calories
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-leaderboard', variables.clubId] });
    }
  });
};

export const useDeleteMealLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clubId, userId }: {
      id: string;
      clubId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-leaderboard', variables.clubId] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', variables.userId] });
    }
  });
};

// -------------------------------------------------------------
// COMMENTS
// -------------------------------------------------------------

export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealLogId, userId, content, clubId }: {
      mealLogId: string;
      userId: string;
      content: string;
      clubId: string;
    }) => {
      if (content.trim().length > 300) {
        throw new Error('Comment cannot exceed 300 characters');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          meal_log_id: mealLogId,
          user_id: userId,
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
    }
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, clubId }: {
      commentId: string;
      clubId: string;
    }) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
      return { commentId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
    }
  });
};

// -------------------------------------------------------------
// REACTIONS
// -------------------------------------------------------------

export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealLogId, userId, emoji, clubId }: {
      mealLogId: string;
      userId: string;
      emoji: string;
      clubId: string;
    }) => {
      // Toggle logic: check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('meal_log_id', mealLogId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Delete reaction if clicked again
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { deleted: true };
      } else {
        // Insert new reaction
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            meal_log_id: mealLogId,
            user_id: userId,
            emoji
          })
          .select()
          .single();
        if (error) throw error;
        return { data, deleted: false };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['club-feed', variables.clubId] });
    }
  });
};

// -------------------------------------------------------------
// LEADERBOARDS & STREAKS
// -------------------------------------------------------------

export const useClubLeaderboard = (clubId: string | undefined) => {
  return useQuery({
    queryKey: ['club-leaderboard', clubId],
    queryFn: async () => {
      if (!clubId) return [];

      // Fetch members, profiles, and active streaks
      const { data: members, error: memberError } = await supabase
        .from('club_members')
        .select(`
          user_id,
          profiles (id, username, avatar_url, daily_calorie_goal, goal_type)
        `)
        .eq('club_id', clubId);

      if (memberError) throw memberError;

      const userIds = members.map((m: any) => m.user_id);
      if (userIds.length === 0) return [];

      // Fetch dynamic active streaks from active_streaks view
      const { data: streaks, error: streakError } = await supabase
        .from('active_streaks')
        .select('*')
        .in('user_id', userIds);

      if (streakError) throw streakError;

      // Fetch today's logged calories for the entire club in one query (no N+1 loops)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const startOfToday = today.toISOString();

      const { data: todayLogs, error: logsError } = await supabase
        .from('meal_logs')
        .select('user_id, calories')
        .eq('club_id', clubId)
        .gte('created_at', startOfToday);

      if (logsError) throw logsError;

      // Group consumed calories by user_id
      const caloriesByUser = (todayLogs || []).reduce((acc: Record<string, number>, log) => {
        acc[log.user_id] = (acc[log.user_id] || 0) + log.calories;
        return acc;
      }, {});

      // Map profiles with streaks, calculate Goal Difference, and build progress indicators
      const mapped = members.map((member: any) => {
        const streak = streaks.find((s: any) => s.user_id === member.user_id) || {
          current_streak: 0,
          longest_streak: 0,
          last_logged_date: null
        };
        
        const goal = member.profiles.daily_calorie_goal;
        const goalType = member.profiles.goal_type;
        const targetWeight = member.profiles.target_weight;
        const consumed = caloriesByUser[member.user_id] || 0;

        const hasGoal = goal !== null && goal > 0;
        const hasLogged = consumed > 0;

        // Calculate absolute difference from calorie target
        const difference = hasGoal ? Math.abs(goal - consumed) : 0;

        return {
          id: member.user_id,
          username: member.profiles.username,
          avatar_url: member.profiles.avatar_url,
          daily_calorie_goal: goal,
          goal_type: goalType,
          target_weight: targetWeight,
          current_streak: streak.current_streak,
          longest_streak: streak.longest_streak,
          consumed,
          difference,
          hasGoal,
          hasLogged
        };
      });

      // Sort leaderboard:
      // 1. Users with goals outrank users without goals (hasGoal = true first)
      // 2. Users who logged calories today outrank those who did not (hasLogged = true first)
      // 3. Smallest absolute difference first (closest to target calories wins!)
      // 4. Tie-breaker: Current streak DESC
      // 5. Tie-breaker: Username ASC
      return mapped.sort((a, b) => {
        if (a.hasGoal && !b.hasGoal) return -1;
        if (!a.hasGoal && b.hasGoal) return 1;

        if (a.hasGoal && b.hasGoal) {
          if (a.hasLogged && !b.hasLogged) return -1;
          if (!a.hasLogged && b.hasLogged) return 1;
          
          if (a.hasLogged && b.hasLogged) {
            if (a.difference !== b.difference) {
              return a.difference - b.difference;
            }
          }
        }

        if (b.current_streak !== a.current_streak) {
          return b.current_streak - a.current_streak;
        }
        return (a.username || '').localeCompare(b.username || '');
      });
    },
    enabled: !!clubId,
  });
};

// -------------------------------------------------------------
// USER PROFILE STATS
// -------------------------------------------------------------

export const useProfileStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Fetch profile details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      // 2. Fetch active streak
      const { data: streak, error: streakError } = await supabase
        .from('active_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError;
      }

      // 3. Count total logs
      const { count, error: countError } = await supabase
        .from('meal_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      return {
        profile,
        streak: streak || { current_streak: 0, longest_streak: 0 },
        totalLogs: count || 0
      };
    },
    enabled: !!userId,
  });
};
