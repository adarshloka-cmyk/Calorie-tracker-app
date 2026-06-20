export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  daily_calorie_goal: number | null;
  goal_type: 'lose_weight' | 'maintain' | 'gain_weight';
  target_weight: number | null;
}

export interface Streak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
}

export interface Club {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
  profiles?: Profile;
  streaks?: Streak;
}

export interface Comment {
  id: string;
  meal_log_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}


export interface MealLog {
  id: string;
  club_id: string;
  user_id: string;
  food_name: string;
  calories: number;
  image_url: string | null;
  created_at: string;
  // AI logging metadata (nullable — manual logs will have these as null)
  original_user_text?: string | null;
  detected_foods_json?: Array<{ name: string; calories: number }> | null;
  profiles?: Profile;
  reactions?: Reaction[];
  comments?: Comment[];
}

export interface Reaction {
  id: string;
  meal_log_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: Profile;
}
