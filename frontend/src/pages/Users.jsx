import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users as UsersIcon, 
  Plus, 
  Shield, 
  User, 
  Phone, 
  Building, 
  Mail, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

const ROLE_CONFIG = {
  admin: { label: 'Administrateur', class: 'bg-rose-100 text-rose-700', icon: Shield },
  manager: { label: 'Manager', class: 'bg-purple-100 text-purple-700', icon: User },
  operator: { label: 'Opérateur', class: 'bg-blue-100 text-blue-700', icon: User },
  viewer: { label: 'Observateur', class: 'bg-slate-100 text-slate-700', icon: User }
};

const STATUS_CONFIG = {
  active: { label: 'Actif', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactif', class: 'bg-red-100 text-red-700', icon: XCircle },
  invited: { label: 'Invité', class: 'bg-yellow-100 text-yellow-700', icon: Clock }
};

export default function Users() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'operator',
    status: 'active',
    phone_number: '',
    department: ''
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.User.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
      setCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur mis à jour');
      setEditOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'operator',
      status: 'active',
      phone_number: '',
      department: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '', // Ne pas pré-remplir le mot de passe
      role: user.role || 'operator',
      status: user.status || 'active',
      phone_number: user.phone_number || '',
      department: user.department || ''
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Ne pas envoyer le mot de passe s'il est vide
    const updateData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    updateMutation.mutate({ id: selectedUser._id, data: updateData });
  };

  const handleDelete = (user) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-slate-500 mt-1">Créez et gérez les accès des utilisateurs du système</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setCreateOpen(true)} className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          )}
        </div>

        {/* Current user card */}
        {currentUser && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
              {currentUser.first_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {currentUser.first_name} {currentUser.last_name} 
                <span className="text-xs text-blue-500 ml-1">(vous)</span>
              </p>
              <p className="text-sm text-slate-500">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={ROLE_CONFIG[currentUser.role]?.class || ROLE_CONFIG.operator.class}>
                  {ROLE_CONFIG[currentUser.role]?.label || currentUser.role}
                </Badge>
                <Badge className={STATUS_CONFIG[currentUser.status]?.class || STATUS_CONFIG.active.class}>
                  {STATUS_CONFIG[currentUser.status]?.label || currentUser.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Users list */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tous les utilisateurs</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="inactive">Inactifs</TabsTrigger>
            <TabsTrigger value="admin">Administrateurs</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user._id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                                {user.first_name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-slate-500">ID: {user._id?.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone_number ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {user.phone_number}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.department ? (
                              <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-slate-400" />
                                {user.department}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={ROLE_CONFIG[user.role]?.class || ROLE_CONFIG.operator.class}>
                              {ROLE_CONFIG[user.role]?.label || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_CONFIG[user.status]?.class || STATUS_CONFIG.active.class}>
                              {STATUS_CONFIG[user.status]?.label || user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.last_login ? (
                              <span className="text-sm text-slate-500">
                                {new Date(user.last_login).toLocaleDateString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isAdmin && user._id !== currentUser?._id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(user)}
                                    className="h-8 w-8"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(user)}
                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-slate-500">
                {users.filter(u => u.status === 'active').length} utilisateurs actifs
              </p>
            </div>
          </TabsContent>

          <TabsContent value="inactive">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-slate-500">
                {users.filter(u => u.status === 'inactive').length} utilisateurs inactifs
              </p>
            </div>
          </TabsContent>

          <TabsContent value="admin">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-slate-500">
                {users.filter(u => u.role === 'admin').length} administrateurs
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez tous les champs pour créer un nouvel utilisateur. Le mot de passe doit contenir au moins 6 caractères.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-slate-500">Minimum 6 caractères</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+33123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Production"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="operator">Opérateur</SelectItem>
                      <SelectItem value="viewer">Observateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="invited">Invité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Création...' : 'Créer l\'utilisateur'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de {selectedUser?.first_name} {selectedUser?.last_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_first_name">Prénom *</Label>
                  <Input
                    id="edit_first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_last_name">Nom *</Label>
                  <Input
                    id="edit_last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_password">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
                <Input
                  id="edit_password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-xs text-slate-500">Minimum 6 caractères</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone_number">Téléphone</Label>
                  <Input
                    id="edit_phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_department">Département</Label>
                  <Input
                    id="edit_department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_role">Rôle *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="operator">Opérateur</SelectItem>
                      <SelectItem value="viewer">Observateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Statut *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="invited">Invité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
