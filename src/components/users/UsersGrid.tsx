import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ManagedUser } from '@/hooks/useUsersManagement';
import { Calendar, Clock, Edit, Link, Loader2, Mail, Phone, Stethoscope, Trash2, User } from 'lucide-react';

type UsersGridProps = {
  currentAuthUserId?: string;
  isLinkingSchedule: boolean;
  loading: boolean;
  onConfigureSchedule: (userId: string) => void;
  onDeleteClick: (user: ManagedUser) => void;
  onEditClick: (user: ManagedUser) => void;
  onLinkSchedule: (userId: string) => void;
  users: ManagedUser[];
};

export function UsersGrid({
  currentAuthUserId,
  isLinkingSchedule,
  loading,
  onConfigureSchedule,
  onDeleteClick,
  onEditClick,
  onLinkSchedule,
  users,
}: UsersGridProps) {
  if (!loading && users.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-center text-muted-foreground">Nenhum usuario encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <Card key={user.id} className="transition-all duration-200 hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={user.avatar_url ?? undefined} alt={user.name ?? undefined} />
                  <AvatarFallback
                    className={
                      user.role === 'owner'
                        ? 'bg-purple-500 text-white'
                        : user.role === 'doctor'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                    }
                  >
                    {user.name
                      ? user.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{user.name}</h3>
                  <Badge
                    variant="secondary"
                    className={
                      user.role === 'owner'
                        ? 'mt-1 bg-purple-500/10 text-purple-600'
                        : user.role === 'doctor'
                          ? 'mt-1 bg-blue-500/10 text-blue-600'
                          : 'mt-1 bg-green-500/10 text-green-600'
                    }
                  >
                    {user.role === 'owner' ? 'Dono' : user.role === 'doctor' ? 'Medico' : 'Secretaria'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pb-4">
            {user.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{user.email}</span>
              </div>
            )}

            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{user.phone}</span>
              </div>
            )}

            {user.specialization && user.role === 'doctor' && (
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{user.specialization}</span>
              </div>
            )}

            <div className="flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Criado em{' '}
                {new Date((user as ManagedUser & { created_at?: string }).created_at ?? '').toLocaleDateString(
                  'pt-BR'
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-3">
              <Button variant="outline" size="sm" onClick={() => onEditClick(user)} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>

              {user.role === 'doctor' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConfigureSchedule(user.id)}
                    className="flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Agenda
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLinkSchedule(user.id)}
                    disabled={isLinkingSchedule}
                    className="flex-1"
                  >
                    {isLinkingSchedule ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <Link className="mr-2 h-4 w-4" />
                        Vincular
                      </>
                    )}
                  </Button>
                </>
              )}

              {user.role !== 'owner' && user.auth_user_id !== currentAuthUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteClick(user)}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
