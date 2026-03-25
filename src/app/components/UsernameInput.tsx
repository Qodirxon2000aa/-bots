import { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';
import { useApp, TelegramProfile } from '@/app/context/AppContext';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onProfileFound?: (profile: TelegramProfile) => void;
}

export function UsernameInput({ value, onChange, onProfileFound }: UsernameInputProps) {
  const { lookupTelegramUser } = useApp();
  const [profile, setProfile] = useState<TelegramProfile>({ username: '', displayName: '', verified: false, status: 'idle' });
  const [isLooking, setIsLooking] = useState(false);

  useEffect(() => {
    const cleanUsername = value.replace('@', '').trim();
    
    if (!cleanUsername) {
      setProfile({ username: '', displayName: '', verified: false, status: 'idle' });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLooking(true);
      const result = await lookupTelegramUser(cleanUsername);
      setProfile(result);
      setIsLooking(false);
      if (result.status === 'found' && onProfileFound) {
        onProfileFound(result);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [value, lookupTelegramUser, onProfileFound]);

  const showPreview = value.length > 0 && (isLooking || profile.status !== 'idle');

  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          @
        </span>
        <Input
          type="text"
          placeholder="username"
          value={value.replace('@', '')}
          onChange={(e) => onChange(e.target.value.replace('@', ''))}
          className="pl-8"
        />
      </div>

      {showPreview && (
        <Card className="overflow-hidden">
          <div className="p-4">
            {isLooking && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                </div>
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}

            {!isLooking && profile.status === 'found' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{profile.displayName}</p>
                    {profile.verified && (
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              </div>
            )}

            {!isLooking && profile.status === 'not-found' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">User not found</p>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                </div>
                <Badge variant="destructive">Not Found</Badge>
              </div>
            )}

            {!isLooking && profile.status === 'invalid' && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-destructive">Invalid username</p>
                  <p className="text-sm text-muted-foreground">Must be 5-32 characters</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
