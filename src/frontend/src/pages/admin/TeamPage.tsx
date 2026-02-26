import { useState } from 'react';
import {
  useGetCallerUserProfile,
  useListUsers,
  useUpdateUserRole,
  useRemoveUser,
} from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { Role, User } from '../../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  pastor: 'Pastor',
  volunteer: 'Volunteer',
  superAdmin: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  pastor: 'bg-purple-100 text-purple-700',
  volunteer: 'bg-green-100 text-green-700',
  superAdmin: 'bg-orange-100 text-orange-700',
};

function UserRow({
  user,
  churchId,
  onRoleChange,
  onRemove,
}: {
  user: User;
  churchId: string;
  onRoleChange: (userId: string, role: Role, churchId: string) => void;
  onRemove: (userId: string, churchId: string) => void;
}) {
  const roleKey = typeof user.role === 'string' ? user.role : Object.keys(user.role)[0];
  const userIdStr = user.id.toString();

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-primary text-sm font-bold">
          {user.email ? user.email.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{user.email || 'No email'}</p>
        <p className="text-xs text-muted-foreground truncate">{userIdStr.slice(0, 24)}...</p>
      </div>
      <Badge className={`${ROLE_COLORS[roleKey] || 'bg-muted text-muted-foreground'} border-0 text-xs`}>
        {ROLE_LABELS[roleKey] || roleKey}
      </Badge>
      <Select
        value={roleKey}
        onValueChange={(v) => onRoleChange(userIdStr, v as Role, churchId)}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="pastor">Pastor</SelectItem>
          <SelectItem value="volunteer">Volunteer</SelectItem>
        </SelectContent>
      </Select>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {user.email || userIdStr.slice(0, 16)} from your church team? They will lose access to the admin portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove(userIdStr, churchId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeamPage() {
  const { data: profile } = useGetCallerUserProfile();
  const churchId = profile?.churchId || '';
  const { data: users = [], isLoading } = useListUsers(churchId);
  const updateRole = useUpdateUserRole();
  const removeUser = useRemoveUser();

  const [principalInput, setPrincipalInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<string>('volunteer');

  // userId is already a string (Principal.toString()) from UserRow
  const handleRoleChange = async (userId: string, role: Role, cId: string) => {
    try {
      await updateRole.mutateAsync({ userId, role, churchId: cId });
      toast.success('Role updated');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId: string, cId: string) => {
    try {
      await removeUser.mutateAsync({ userId, churchId: cId });
      toast.success('Team member removed');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error?.message || 'Failed to remove user');
    }
  };

  const handleInvite = async () => {
    if (!principalInput.trim() || !emailInput.trim()) {
      toast.error('Principal ID and email are required');
      return;
    }
    try {
      // Validate the principal format before calling
      Principal.fromText(principalInput.trim());
      toast.info(
        `Share your Church ID (${churchId}) with ${emailInput} so they can join via the setup screen.`
      );
      setPrincipalInput('');
      setEmailInput('');
    } catch {
      toast.error('Invalid Principal ID format');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-muted-foreground mt-1">Manage your church staff and volunteers</p>
      </div>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground">
            <strong>How to invite:</strong> Share your Church ID{' '}
            <code className="bg-muted px-1 rounded text-xs font-mono">{churchId}</code>{' '}
            with your team member. They can use it on the setup screen to join your church.
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Principal ID</Label>
              <Input
                placeholder="aaaaa-bbbbb-..."
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="staff@church.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Select value={roleInput} onValueChange={setRoleInput}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleInvite}>
            <UserPlus className="w-4 h-4 mr-2" />
            Send Invite Info
          </Button>
        </CardContent>
      </Card>

      {/* Team list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Current Team ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No team members yet</p>
            </div>
          ) : (
            <div>
              {users.map((user) => (
                <UserRow
                  key={user.id.toString()}
                  user={user}
                  churchId={churchId}
                  onRoleChange={handleRoleChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
