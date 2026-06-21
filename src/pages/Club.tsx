import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  useClubDetails, 
  useClubFeed, 
  useAddMealLog, 
  useAddReaction, 
  useClubLeaderboard,
  useAddComment,
  useDeleteComment,
  useUpdateMealLog,
  useDeleteMealLog
} from '../services/db';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { supabase } from '../services/supabase';
import { 
  ArrowLeft, 
  Flame, 
  Share2, 
  Check, 
  Utensils, 
  Award,
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Copy,
  Crown,
  AlertTriangle,
  X
} from 'lucide-react';

export default function Club() {
  const { id: clubId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: club, isLoading: loadingClub } = useClubDetails(clubId);
  const { data: feed, isLoading: loadingFeed } = useClubFeed(clubId);
  const { data: leaderboard, isLoading: loadingLeaderboard } = useClubLeaderboard(clubId);

  const addMealLogMutation = useAddMealLog();
  const addReactionMutation = useAddReaction();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const updateMealLogMutation = useUpdateMealLog();
  const deleteMealLogMutation = useDeleteMealLog();

  // Meal Log Composer State
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [composerError, setComposerError] = useState<string | null>(null);

  // AI Logging State
  const [mealDescription, setMealDescription] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiResult, setAiResult] = useState<{ foods: Array<{ name: string; calories: number }>; totalCalories: number } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);

  // Delete Club State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClub, setDeletingClub] = useState(false);

  // Meal Log Edit State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [editCalories, setEditCalories] = useState('');

  // Comments Input state (mapped by mealLogId)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComments, setSubmittingComments] = useState<Record<string, boolean>>({});

  // General States
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');

  if (loadingClub) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex items-center justify-center font-sans font-bold text-brand-primary">
        Loading club details...
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#F8F4EF] flex flex-col items-center justify-center font-sans px-6 text-center">
        <h2 className="font-display font-black text-2xl text-brand-primary mb-2">Club not found</h2>
        <p className="text-sm font-bold text-brand-primary/60 mb-6">This club may have been deleted or you don't have access.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(club.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${club.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my club ${club.name} on FitClub!`,
          text: `Track calories with friends, stay consistent and own the leaderboard!`,
          url: inviteUrl,
        });
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy invite link:', err);
      }
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clubId) return;
    setComposerError(null);

    if (!foodName.trim()) {
      setComposerError('What did you eat?');
      return;
    }

    const cals = parseInt(calories);
    if (isNaN(cals) || cals <= 0) {
      setComposerError('Please enter valid calories');
      return;
    }

    try {
      await addMealLogMutation.mutateAsync({
        clubId,
        userId: user.id,
        foodName: foodName.trim(),
        calories: cals,
        imageUrl: null
      });

      setFoodName('');
      setCalories('');
      setShowManualFallback(false);
    } catch (err: any) {
      console.error(err);
      setComposerError(err.message || 'Failed to submit log. Please try again.');
    }
  };

  const handleEstimate = async () => {
    if (!mealDescription.trim()) return;
    setIsEstimating(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-calories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ description: mealDescription.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Estimation failed');
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || 'AI estimation failed. Use manual entry below.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleConfirmAiLog = async () => {
    if (!user || !clubId || !aiResult) return;
    setComposerError(null);
    try {
      await addMealLogMutation.mutateAsync({
        clubId,
        userId: user.id,
        foodName: mealDescription.trim(),
        calories: aiResult.totalCalories,
        imageUrl: null,
        originalUserText: mealDescription.trim(),
        detectedFoodsJson: aiResult.foods,
      });
      setMealDescription('');
      setAiResult(null);
      setAiError(null);
    } catch (err: any) {
      setComposerError(err.message || 'Failed to submit log. Please try again.');
    }
  };

  const handleStartEdit = (log: any) => {
    setEditingLogId(log.id);
    setEditFoodName(log.food_name);
    setEditCalories(String(log.calories));
  };

  const handleSaveEdit = async (logId: string) => {
    const cals = parseInt(editCalories);
    if (!editFoodName.trim() || isNaN(cals) || cals <= 0) return;
    try {
      await updateMealLogMutation.mutateAsync({
        id: logId,
        foodName: editFoodName.trim(),
        calories: cals,
        clubId: club.id
      });
      setEditingLogId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this meal log? This will update your streaks and leaderboard position immediately.')) {
      try {
        await deleteMealLogMutation.mutateAsync({
          id: logId,
          clubId: club.id,
          userId: user.id
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReact = async (mealLogId: string, emoji: string) => {
    if (!user || !clubId) return;
    try {
      await addReactionMutation.mutateAsync({
        mealLogId,
        userId: user.id,
        emoji,
        clubId
      });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };



  const handlePostComment = async (e: React.FormEvent, mealLogId: string) => {
    e.preventDefault();
    const commentContent = (commentInputs[mealLogId] || '').trim();
    if (!user || !clubId || !commentContent) return;

    setSubmittingComments((prev) => ({ ...prev, [mealLogId]: true }));
    try {
      await addCommentMutation.mutateAsync({
        mealLogId,
        userId: user.id,
        content: commentContent,
        clubId
      });
      setCommentInputs((prev) => ({ ...prev, [mealLogId]: '' }));
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [mealLogId]: false }));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!clubId) return;
    try {
      await deleteCommentMutation.mutateAsync({ commentId, clubId });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  // Predefined reaction list
  const reactionEmojis = ['🔥', '💪', '😂', '👏'];

  // Calculations for Weekly Squad Stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const mealsThisWeek = feed ? feed.filter(log => new Date(log.created_at) >= sevenDaysAgo).length : 0;

  const membersWithGoals = leaderboard?.filter(m => m.hasGoal) || [];

  return (
    <div className="min-h-screen bg-[#F8F4EF] font-sans text-brand-text pb-20 overflow-y-auto">
      {/* Club Header Navigation */}
      <header className="border-b-[3.5px] border-brand-primary bg-white py-4 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 border-2 border-brand-primary rounded-full hover:bg-[#F8F4EF] transition-all text-brand-primary cursor-pointer"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-3xl" role="img" aria-label="emoji">
                {club.emoji}
              </span>
              <div>
                <h1 className="font-display font-black text-xl sm:text-2xl text-brand-primary line-clamp-1 leading-tight">
                  {club.name}
                </h1>
                <p className="text-[10px] font-bold text-brand-primary/50 uppercase tracking-widest">
                  Invite Code: <span className="font-mono text-brand-accent">{club.invite_code}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-primary bg-[#F8F4EF] hover:bg-white rounded-full transition-all text-[10px] font-black text-brand-primary shadow-[2px_2px_0_0_#6D001F] active:translate-y-[1px] active:shadow-none cursor-pointer"
              title="Copy Invite Code"
            >
              {copiedCode ? <Check className="w-3 text-green-600" /> : <Copy className="w-3" />}
              <span className="hidden sm:inline">{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
            </button>
            <button 
              onClick={handleShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-brand-primary bg-brand-primary text-white rounded-full transition-all text-[10px] font-black shadow-[2px_2px_0_0_#400012] active:translate-y-[1px] active:shadow-none cursor-pointer"
              title="Share Invite Link"
            >
              {copied ? <Check className="w-3 text-green-300" /> : <Share2 className="w-3" />}
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-8">
        
        {/* Mobile Tab Toggle */}
        <div className="flex md:hidden border-[3px] border-brand-primary rounded-2xl bg-white p-1 mb-6 shadow-[3px_3px_0_0_#6D001F]">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${
              activeTab === 'feed' 
                ? 'bg-brand-primary text-white' 
                : 'text-brand-primary'
            }`}
          >
            Club Feed
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${
              activeTab === 'leaderboard' 
                ? 'bg-brand-primary text-white' 
                : 'text-brand-primary'
            }`}
          >
            Leaderboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Main Feed Section */}
          <div className={`md:col-span-2 space-y-6 ${activeTab === 'feed' ? 'block' : 'hidden md:block'}`}>
            
            {/* Meal Log Composer Card — AI-First with Manual Fallback */}
            <Card hoverable={false} className="border-[3.5px] p-5 sm:p-6 bg-white">
              <h3 className="font-display font-black text-xl text-brand-primary mb-1 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-accent" />
                <span>Log a Meal</span>
                <span className="ml-auto text-[9px] font-bold text-brand-primary/40 uppercase tracking-widest border border-brand-primary/20 px-2 py-0.5 rounded-full">AI ✨</span>
              </h3>
              <p className="text-[11px] font-bold text-brand-primary/50 mb-4">
                Describe what you ate — AI will estimate the calories.
              </p>

              {/* AI Error Banner */}
              {aiError && (
                <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Composer Error Banner */}
              {composerError && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-brand-secondary/20 rounded-xl text-xs font-bold text-brand-secondary">
                  {composerError}
                </div>
              )}

              {/* AI Textarea Input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                    What did you eat?
                  </label>
                  <textarea
                    rows={2}
                    value={mealDescription}
                    onChange={(e) => {
                      setMealDescription(e.target.value);
                      setAiResult(null);
                      setAiError(null);
                    }}
                    placeholder="e.g. 2 idlis, sambar and coffee"
                    className="block w-full px-3 py-2.5 border-[2.5px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30 resize-none leading-relaxed"
                  />
                </div>

                {/* AI Result Breakdown */}
                {aiResult && (
                  <div className="bg-[#F8F4EF] border-2 border-brand-primary/20 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">🤖 AI Estimate</span>
                      <span className="font-mono font-black text-brand-primary text-base">{aiResult.totalCalories} kcal</span>
                    </div>
                    <div className="space-y-1">
                      {aiResult.foods.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-brand-text font-semibold">• {item.name}</span>
                          <span className="font-mono font-bold text-brand-primary/70">{item.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!aiResult ? (
                    <button
                      type="button"
                      onClick={handleEstimate}
                      disabled={isEstimating || !mealDescription.trim()}
                      className="flex-1 py-2.5 px-4 bg-brand-primary text-white rounded-xl font-black text-sm shadow-[3px_3px_0_0_#400012] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {isEstimating ? (
                        <>
                          <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span>Estimating...</span>
                        </>
                      ) : (
                        <span>✨ Estimate Calories</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirmAiLog}
                      disabled={addMealLogMutation.isPending}
                      className="flex-1 py-2.5 px-4 bg-brand-primary text-white rounded-xl font-black text-sm shadow-[3px_3px_0_0_#400012] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {addMealLogMutation.isPending ? 'Logging...' : 'Post Log 🚀'}
                    </button>
                  )}

                  {aiResult && (
                    <button
                      type="button"
                      onClick={() => { setAiResult(null); setAiError(null); }}
                      className="py-2.5 px-3 border-2 border-brand-primary/30 rounded-xl font-bold text-xs text-brand-primary hover:border-brand-primary transition-all"
                    >
                      Re-estimate
                    </button>
                  )}
                </div>
              </div>

              {/* Manual Entry Fallback — Collapsed by Default */}
              <div className="mt-4 border-t border-brand-primary/10 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManualFallback((v) => !v)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-brand-primary/50 uppercase tracking-wider hover:text-brand-primary transition-colors"
                >
                  <span>{showManualFallback ? '▾' : '▸'}</span>
                  <span>Enter calories manually</span>
                </button>

                {showManualFallback && (
                  <form onSubmit={handleAddLog} className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                          Food Name
                        </label>
                        <input
                          type="text"
                          required
                          value={foodName}
                          onChange={(e) => setFoodName(e.target.value)}
                          placeholder="e.g. Chicken Biryani"
                          className="block w-full px-3 py-2 border-[2.5px] border-brand-primary/50 rounded-xl focus:border-brand-primary focus:outline-none text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-primary uppercase tracking-wider mb-1.5">
                          Calories (kcal)
                        </label>
                        <input
                          type="number"
                          required
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder="e.g. 680"
                          min={1}
                          className="block w-full px-3 py-2 border-[2.5px] border-brand-primary/50 rounded-xl focus:border-brand-primary focus:outline-none text-sm font-bold bg-[#F8F4EF]/30 placeholder-brand-primary/30"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="secondary"
                        className="py-2 px-5 text-sm"
                        disabled={addMealLogMutation.isPending}
                      >
                        {addMealLogMutation.isPending ? 'Logging...' : 'Log Manually'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>

            {/* Logs Timeline — Activity Feed */}
            <div className="space-y-4">
              <h3 className="font-display font-black text-2xl text-brand-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-accent" />
                Activity Feed
              </h3>

              {loadingFeed ? (
                <div className="py-12 text-center text-brand-primary/50 font-bold text-sm">
                  Fetching recent meals...
                </div>
              ) : !feed || feed.length === 0 ? (
                <div className="border-[3px] border-dashed border-brand-primary/20 rounded-[24px] p-12 text-center bg-white/50">
                  <p className="text-sm font-bold text-brand-primary/60">
                    Nobody has logged a meal in this club yet. Be the first!
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {feed.map((log) => {
                    const initials = log.profiles?.username?.substring(0, 2).toUpperCase() || 'U';
                    const hasUserReacted = (emoji: string) =>
                      log.reactions?.some((r) => r.user_id === user?.id && r.emoji === emoji);

                    const reactionCounts = log.reactions?.reduce((acc: Record<string, number>, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {}) || {};

                    const isOwner = log.user_id === user?.id;
                    const isEditing = editingLogId === log.id;

                    // Sort comments newest first
                    const sortedComments = log.comments
                      ? [...log.comments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      : [];

                    return (
                      <Card key={log.id} hoverable={false} className="border-[3.5px] p-5 sm:p-6 bg-white">
                        {/* User Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-brand-primary/10 mb-4">
                          <div className="flex items-center gap-3">
                            {log.profiles?.avatar_url ? (
                              <img
                                src={log.profiles.avatar_url}
                                alt={log.profiles.username}
                                className="w-9 h-9 rounded-full border-2 border-brand-primary object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-brand-accent text-white border-2 border-brand-primary flex items-center justify-center text-xs font-black">
                                {initials}
                              </div>
                            )}
                            <div>
                              <h4 className="text-sm font-black text-brand-primary leading-tight">
                                {log.profiles?.username}
                              </h4>
                              <span className="text-[10px] font-bold text-brand-primary/50">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isOwner && !isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEdit(log)}
                                  className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-brand-primary/20 rounded text-brand-primary/60 hover:text-brand-primary cursor-pointer"
                                  title="Edit Log"
                                >
                                  <Edit className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLog(log.id)}
                                  disabled={deleteMealLogMutation.isPending}
                                  className="p-1.5 hover:bg-red-50 border border-transparent hover:border-brand-secondary/20 rounded text-brand-secondary/60 hover:text-brand-secondary cursor-pointer disabled:opacity-50"
                                  title="Delete Log"
                                >
                                  <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                                </button>
                              </div>
                            )}

                            <span className="inline-block px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full text-xs font-black text-brand-primary font-mono">
                              {log.calories} kcal
                            </span>
                          </div>
                        </div>

                        {/* Log Info / Editing View */}
                        {isEditing ? (
                          <div className="bg-[#F8F4EF]/45 p-4 rounded-xl border-[2.5px] border-brand-primary mb-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-brand-primary uppercase mb-1">Food Name</label>
                                <input
                                  type="text"
                                  value={editFoodName}
                                  onChange={(e) => setEditFoodName(e.target.value)}
                                  className="w-full px-2 py-1.5 border-2 border-brand-primary rounded-lg text-xs font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-brand-primary uppercase mb-1">Calories (kcal)</label>
                                <input
                                  type="number"
                                  value={editCalories}
                                  onChange={(e) => setEditCalories(e.target.value)}
                                  className="w-full px-2 py-1.5 border-2 border-brand-primary rounded-lg text-xs font-bold"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 text-xs">
                              <button
                                onClick={() => setEditingLogId(null)}
                                className="px-3 py-1.5 border border-brand-primary/30 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(log.id)}
                                className="px-3 py-1.5 bg-brand-primary text-white rounded-lg font-black hover:opacity-95 cursor-pointer"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base text-brand-text font-bold leading-relaxed mb-4 text-left">
                            Logged <span className="text-brand-primary font-extrabold">{log.food_name}</span>
                          </p>
                        )}

                        {/* Reactions */}
                        <div className="flex flex-wrap items-center gap-2.5 mt-3">
                          {reactionEmojis.map((emoji) => {
                            const count = reactionCounts[emoji] || 0;
                            const isAct = hasUserReacted(emoji);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(log.id, emoji)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                                  isAct
                                    ? 'bg-brand-primary/15 border-brand-primary text-brand-primary shadow-[2px_2px_0_0_#6D001F]'
                                    : 'bg-white border-brand-primary/30 hover:border-brand-primary text-brand-primary/70'
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="font-extrabold text-[10px]">{count}</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* Comments Section */}
                        <div className="mt-4 pt-4 border-t border-brand-primary/10 space-y-3 text-left">
                          <h5 className="text-xs font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-brand-primary/60" />
                            <span>Comments ({log.comments?.length || 0})</span>
                          </h5>

                          {/* Comments List — newest first, max-height 300px */}
                          {sortedComments.length > 0 && (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                              {sortedComments.map((c) => {
                                const cInitials = c.profiles?.username?.substring(0, 2).toUpperCase() || 'U';
                                const isCommentOwner = c.user_id === user?.id;
                                return (
                                  <div key={c.id} className="bg-[#F8F4EF]/45 border border-brand-primary/10 p-2.5 rounded-xl flex gap-2.5 items-start group">
                                    {c.profiles?.avatar_url ? (
                                      <img
                                        src={c.profiles.avatar_url}
                                        alt={c.profiles.username}
                                        className="w-6 h-6 rounded-full border border-brand-primary object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-brand-accent text-white border border-brand-primary flex items-center justify-center text-[8px] font-black shrink-0">
                                        {cInitials}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-black text-brand-primary">{c.profiles?.username}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[8px] font-bold text-brand-primary/45 font-mono">
                                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          {isCommentOwner && (
                                            <button
                                              onClick={() => handleDeleteComment(c.id)}
                                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 text-brand-secondary/50 hover:text-brand-secondary transition-all cursor-pointer"
                                              title="Delete comment"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-xs font-medium text-brand-text break-words">{c.content}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Add Comment Input */}
                          <form onSubmit={(e) => handlePostComment(e, log.id)} className="flex gap-2 items-center mt-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                maxLength={300}
                                value={commentInputs[log.id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [log.id]: e.target.value })}
                                placeholder="Add a comment... (max 300)"
                                className="block w-full pl-3 pr-10 py-2 border-[2px] border-brand-primary/50 rounded-xl focus:border-brand-primary focus:outline-none text-xs font-bold bg-[#F8F4EF]/20 placeholder-brand-primary/30"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-brand-primary/40">
                                {300 - (commentInputs[log.id] || '').length}
                              </span>
                            </div>
                            <button
                              type="submit"
                              disabled={!(commentInputs[log.id] || '').trim() || submittingComments[log.id]}
                              className="p-2 border-2 border-brand-primary bg-brand-primary text-white rounded-xl active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Meals section — current user's logs only */}
            {user && feed && feed.filter(l => l.user_id === user.id).length > 0 && (
              <div className="space-y-4 mt-2">
                <h3 className="font-display font-black text-2xl text-brand-primary flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-brand-accent" />
                  My Meals
                </h3>
                <div className="space-y-3">
                  {feed
                    .filter(l => l.user_id === user.id)
                    .map(log => (
                      <div key={log.id} className="flex items-center justify-between bg-white border-[2.5px] border-brand-primary/20 hover:border-brand-primary/50 rounded-2xl px-4 py-3 transition-all">
                        <div>
                          <p className="text-sm font-black text-brand-primary">{log.food_name}</p>
                          <span className="text-[10px] font-bold text-brand-primary/50">
                            {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm text-brand-primary bg-brand-primary/5 border border-brand-primary/10 px-3 py-1 rounded-full">
                          {log.calories} kcal
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Leaderboard & Members */}
          <div className={`space-y-6 ${activeTab === 'leaderboard' ? 'block' : 'hidden md:block'}`}>
            
            {/* Leaderboard Cards */}
            <h3 className="font-display font-black text-2xl text-brand-primary flex items-center gap-2">
              <Award className="w-6 h-6 text-brand-accent" />
              <span>Daily Leaderboard</span>
            </h3>

            {loadingLeaderboard ? (
              <div className="py-8 text-center text-brand-primary/50 font-bold text-xs">
                Computing scores...
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="py-6 text-center text-brand-primary/50 font-bold text-xs bg-white rounded-[24px] border-[3px] border-brand-primary/20">
                No members found.
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((member, index) => {
                  const isTop = index === 0;
                  const initials = member.username?.substring(0, 2).toUpperCase() || 'U';
                  const goal = member.daily_calorie_goal;
                  const consumed = member.consumed;
                  const diff = member.difference;

                  // Status Badge Logic
                  let statusBadge = '';
                  let statusColor = '';
                  
                  if (!member.hasGoal) {
                    statusBadge = 'No Calorie Goal';
                    statusColor = 'bg-slate-100 text-slate-600 border-slate-300';
                  } else if (!member.hasLogged) {
                    statusBadge = '❌ No Log Today';
                    statusColor = 'bg-red-50 text-red-600 border-red-200';
                  } else if (consumed === goal) {
                    statusBadge = '🎯 Goal Hit';
                    statusColor = 'bg-green-100 text-green-700 border-green-300';
                  } else if (consumed > goal) {
                    statusBadge = '⚠️ Over Goal';
                    statusColor = 'bg-amber-100 text-amber-700 border-amber-300';
                  } else {
                    const isClose = consumed >= goal - 200;
                    if (isClose) {
                      statusBadge = '🔥 On Track';
                      statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else {
                      statusBadge = '📉 Under Goal';
                      statusColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                    }
                  }

                  return (
                    <div 
                      key={member.id} 
                      className={`flex flex-col p-4 rounded-2xl border-[2.5px] transition-all bg-white relative ${
                        isTop 
                          ? 'border-brand-primary shadow-[3px_3px_0_0_#6D001F]' 
                          : 'border-brand-primary/20 hover:border-brand-primary/50'
                      }`}
                    >
                      {/* Member Header Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-xs text-brand-primary/60 w-4 text-left">
                            {index + 1}.
                          </span>
                          
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.username} 
                              className="w-7.5 h-7.5 rounded-full border border-brand-primary object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7.5 h-7.5 rounded-full bg-[#F8F4EF] border border-brand-primary flex items-center justify-center text-[9px] font-black text-brand-primary shrink-0">
                              {initials}
                            </div>
                          )}
                          
                          <div className="min-w-0 text-left">
                            <span className="font-extrabold text-xs text-brand-primary flex items-center gap-1 leading-tight truncate">
                              {member.username} {isTop && <Crown className="w-3.5 h-3.5 text-brand-accent fill-brand-accent shrink-0" />}
                            </span>
                            {goal && member.hasLogged && (
                              <span className="text-[8px] font-bold text-brand-primary/45 uppercase tracking-wider block">
                                Diff: <span className="font-mono text-brand-accent font-black">{diff} kcal</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-0.5 bg-[#F8F4EF] border border-brand-primary/10 px-1.5 py-0.5 rounded-lg" title="Current Streak">
                            <Flame className={`w-3 h-3 ${member.current_streak > 0 ? 'text-brand-accent fill-brand-accent' : 'text-brand-primary/25'}`} />
                            <span className="font-mono font-black text-[10px] text-brand-primary">
                              {member.current_streak}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Goal Progress Details */}
                      {goal ? (
                        <div className="space-y-2 border-t border-brand-primary/5 pt-2 text-left">
                          {/* Goals numeric indicators */}
                          <div className="grid grid-cols-3 gap-1 text-[8px] font-bold text-brand-primary/60 text-center">
                            <div className="bg-[#F8F4EF]/45 p-1 rounded border border-brand-primary/5">
                              <span className="block text-brand-primary/40 uppercase">Goal</span>
                              <span className="font-mono font-black text-[9px] text-brand-primary">{goal} kcal</span>
                            </div>
                            <div className="bg-[#F8F4EF]/45 p-1 rounded border border-brand-primary/5">
                              <span className="block text-brand-primary/40 uppercase">Logged</span>
                              <span className="font-mono font-black text-[9px] text-brand-primary">{consumed} kcal</span>
                            </div>
                            <div className="bg-[#F8F4EF]/45 p-1 rounded border border-brand-primary/5">
                              <span className="block text-brand-primary/40 uppercase">Diff</span>
                              <span className="font-mono font-black text-[9px] text-brand-accent">{diff} kcal</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="relative w-full h-1.5 bg-slate-100 border border-brand-primary/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                consumed === goal ? 'bg-green-500' :
                                consumed > goal ? 'bg-amber-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.round((consumed / goal) * 100))}%` }}
                            />
                          </div>

                          {/* Status label */}
                          <div className="flex justify-between items-center text-[9px] font-black">
                            <span className="text-brand-primary/40 uppercase tracking-wide">Status:</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[8px] uppercase tracking-wider font-extrabold ${statusColor}`}>
                              {statusBadge}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-brand-primary/5 pt-2 text-center text-[9px] font-bold text-brand-primary/50 py-1 bg-[#F8F4EF]/35 rounded-xl border border-brand-primary/10">
                          <span>No calorie goal set</span>
                          {member.id === user?.id && (
                            <button 
                              onClick={() => navigate('/profile')} 
                              className="block mx-auto mt-1 text-brand-accent underline hover:text-brand-primary font-black uppercase text-[8px] cursor-pointer"
                            >
                              Set Calorie Goal 🎯
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Weekly Squad Stats */}
            <div className="bg-white border-[3.5px] border-brand-primary rounded-[24px] p-5 shadow-[4px_4px_0_0_#6D001F]">
              <h4 className="font-display font-black text-base text-brand-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-brand-accent" />
                <span>Weekly Squad Stats</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#F8F4EF]/55 p-3 rounded-2xl border-2 border-brand-primary/10">
                  <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-wider mb-1">Active</span>
                  <span className="font-display font-black text-2xl text-brand-primary leading-none font-mono">
                    {leaderboard?.length || 0}
                  </span>
                </div>
                <div className="bg-[#F8F4EF]/55 p-3 rounded-2xl border-2 border-brand-primary/10">
                  <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-wider mb-1">Avg Streak</span>
                  <span className="font-display font-black text-2xl text-brand-primary leading-none font-mono">
                    {leaderboard && leaderboard.length > 0 
                      ? Math.round(leaderboard.reduce((acc, m) => acc + m.current_streak, 0) / leaderboard.length) 
                      : 0}d
                  </span>
                </div>
                <div className="bg-[#F8F4EF]/55 p-3 rounded-2xl border-2 border-brand-primary/10">
                  <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-wider mb-1">Avg Diff</span>
                  <span className="font-display font-black text-2xl text-brand-primary leading-none font-mono">
                    {membersWithGoals.length > 0 
                      ? Math.round(membersWithGoals.reduce((acc, m) => acc + m.difference, 0) / membersWithGoals.length)
                      : 0}c
                  </span>
                </div>
                <div className="bg-[#F8F4EF]/55 p-3 rounded-2xl border-2 border-brand-primary/10">
                  <span className="block text-[9px] font-black text-brand-primary/40 uppercase tracking-wider mb-1">Logged (Wk)</span>
                  <span className="font-display font-black text-2xl text-brand-primary leading-none font-mono">
                    {mealsThisWeek}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Club — owner only */}
            {club.owner_id === user?.id && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-brand-secondary/30 rounded-2xl text-xs font-black text-brand-secondary/70 hover:border-brand-secondary hover:text-brand-secondary hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Club
                </button>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Delete Club Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-brand-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card hoverable={false} className="w-full max-w-sm border-[3.5px] p-6 bg-white relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-brand-secondary/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-brand-secondary" />
              </div>
              <div>
                <h3 className="font-display font-black text-xl text-brand-primary">Delete this club permanently?</h3>
                <p className="text-xs font-bold text-brand-primary/60 mt-2 leading-relaxed">
                  This will permanently delete <strong>{club.name}</strong> along with all members, meal logs, comments, and reactions. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button
                  variant="ghost"
                  className="flex-1 py-2 text-sm text-brand-primary border border-brand-primary/10"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingClub}
                >
                  Cancel
                </Button>
                <button
                  onClick={async () => {
                    if (!clubId) return;
                      setDeletingClub(true);
                    try {
                      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
                      if (error) throw error;
                      navigate('/dashboard');
                    } catch (err) {
                      console.error('Failed to delete club:', err);
                      setDeletingClub(false);
                      setShowDeleteModal(false);
                    }
                  }}
                  disabled={deletingClub}
                  className="flex-1 py-2 px-4 bg-brand-secondary border-2 border-brand-secondary text-white rounded-full text-sm font-black cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {deletingClub ? 'Deleting...' : 'Delete Club'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
