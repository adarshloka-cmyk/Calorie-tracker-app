import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Lock, Mail, User, AlertCircle, Sparkles } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const mode = searchParams.get('mode');
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(mode === 'signup');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          throw new Error('Username is required');
        }
        if (username.length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        await signUp(email, password, username.trim());
      } else {
        await signIn(email, password);
      }
      // Redirect after success
      navigate(redirect);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 font-sans text-brand-text">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <h2 
          className="font-display font-black text-brand-primary text-4xl tracking-tight cursor-pointer select-none mb-2"
          onClick={() => navigate('/')}
        >
          FITCLUB
        </h2>
        <p className="text-sm font-extrabold text-brand-primary/60">
          {isSignUp ? 'Join the daily calorie accountability club' : 'Welcome back to FitClub'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card hoverable={false} className="border-[3.5px] p-6 sm:p-8">
          <h3 className="font-display font-black text-2xl text-brand-primary mb-6 text-center">
            {isSignUp ? 'Create your profile' : 'Sign in to your account'}
          </h3>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-brand-secondary/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-brand-secondary leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-black text-brand-primary uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-primary/40">
                    <User className="h-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="fit_champion"
                    className="block w-full pl-10 pr-3 py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/50 placeholder-brand-primary/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-brand-primary uppercase tracking-wider mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-primary/40">
                  <Mail className="h-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full pl-10 pr-3 py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/50 placeholder-brand-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-brand-primary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-primary/40">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border-[3px] border-brand-primary rounded-xl focus:outline-none focus:ring-0 text-sm font-bold bg-[#F8F4EF]/50 placeholder-brand-primary/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 mt-2 justify-center text-sm"
              disabled={loading}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center border-t-2 border-brand-primary/10 pt-5">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs font-extrabold text-brand-primary hover:text-brand-secondary transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
