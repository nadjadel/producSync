import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Factory } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await base44.auth.login(email, password);
      
      if (response.token) {
        localStorage.setItem('producSync_token', response.token);
        navigate(from, { replace: true });
      } else {
        setError('Token de connexion manquant dans la réponse');
      }
    } catch (err) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="CTSM" className="w-20 h-20 rounded-full object-cover shadow-md" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            Connexion à CTSM
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Entrez vos identifiants pour accéder à votre espace de production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@productionsync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="text-center text-sm text-slate-500">
            <p>Utilisez les identifiants de votre compte administrateur</p>
            <p className="mt-1 text-xs">
              Démo : admin@productionsync.com / admin123
            </p>
          </div>
          <div className="w-full border-t border-slate-200 pt-4">
            <p className="text-xs text-center text-slate-400">
              © 2024 CTSM - Tôlerie fine de précision
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
