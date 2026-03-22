import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Users as UsersIcon, Plus, Shield, User } from "lucide-react";
import { toast } from "sonner";

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', class: 'bg-rose-100 text-rose-700' },
  user: { label: 'Utilisateur', class: 'bg-blue-100 text-blue-700' }
};

export default function Users() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Rôle mis à jour');
    }
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    await base44.users.inviteUser(inviteEmail, inviteRole);
    toast.success(`Invitation envoyée à ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('user');
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Utilisateurs</h1>
            <p className="text-slate-500 mt-1">Gérez les accès et les rôles</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setInviteOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Inviter un utilisateur
            </Button>
          )}
        </div>

        {/* Current user card */}
        {currentUser && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
              {currentUser.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{currentUser.full_name} <span className="text-xs text-blue-500 ml-1">(vous)</span></p>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
            </div>
            <Badge className={ROLE_CONFIG[currentUser.role]?.class || ROLE_CONFIG.user.class}>
              {ROLE_CONFIG[currentUser.role]?.label || currentUser.role}
            </Badge>
          </div>
        )}

        {/* Users list */}
        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-16">
                <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">Utilisateur</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">Email</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">Rôle</th>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600">Membre depuis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                            {u.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-slate-800">{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm">{u.email}</td>
                      <td className="px-5 py-4">
                        {isAdmin && u.id !== currentUser?.id ? (
                          <Select
                            value={u.role || 'user'}
                            onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
                          >
                            <SelectTrigger className="w-40 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-rose-500" /> Administrateur
                                </div>
                              </SelectItem>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-blue-500" /> Utilisateur
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={ROLE_CONFIG[u.role]?.class || ROLE_CONFIG.user.class}>
                            {ROLE_CONFIG[u.role]?.label || u.role}
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-sm">
                        {u.created_date ? new Date(u.created_date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Invite Dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Inviter un utilisateur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label>Adresse email *</Label>
                <Input
                  type="email"
                  placeholder="prenom@entreprise.fr"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800">Envoyer l'invitation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}