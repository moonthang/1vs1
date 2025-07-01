'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Github, Swords, Users } from 'lucide-react';
import logo1vs1 from '@/assets/logo/1vs1.png';
import armarEquipoImg from '@/assets/img/armar.jpg';
import comparativaImg from '@/assets/img/1vs1.jpg';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';

export default function LandingPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminClick = () => {
    if (currentUser) {
      router.push('/admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSubmit = async () => {
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      toast({ title: 'Éxito', description: 'Acceso concedido.' });
      setIsLoginModalOpen(false);
      router.push('/admin');
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
          errorMessage = 'Correo o contraseña incorrectos.';
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8 relative">
      <header className="text-center mb-8 max-w-3xl">
        <Image src={logo1vs1} alt="1vs1 FutDraft Logo" width={80} height={98} priority className="mx-auto" />
        <h1 className="text-4xl font-bold text-primary mt-4">1vs1 FutDraft</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Elige un modo y empieza a construir tu equipo ideal.
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="flex flex-col hover:shadow-xl transition-shadow group">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline text-primary">
              <Users className="mr-3 h-7 w-7" />
              Arma tu Equipo
            </CardTitle>
            <CardDescription>
              Selecciona un club, elige una formación y crea tu once inicial. Perfecto para planificar la alineación de tu equipo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div className="my-4 overflow-hidden rounded-md">
                <Image
                    src={armarEquipoImg}
                    alt="Armar equipo de fútbol"
                    width={350}
                    height={600}
                    className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
            </div>
            <Button
              onClick={() => router.push('/build')}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label="Empezar a Construir"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col hover:shadow-xl transition-shadow group">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline text-primary">
              <Swords className="mr-3 h-7 w-7" />
              1 vs 1
            </CardTitle>
            <CardDescription>
              Enfrenta a dos equipos, compara jugadores posición por posición y decide quién tiene la mejor plantilla.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-between">
            <div className="my-4 overflow-hidden rounded-md">
                <Image
                    src={comparativaImg}
                    alt="Comparación de jugadores"
                    width={350}
                    height={600}
                    className="object-cover w-full h-auto transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
            </div>
            <Button
              onClick={() => router.push('/compare')}
              size="lg"
              className="w-full"
              aria-label="Iniciar Comparación"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p className='flex items-center justify-center gap-2'>
          <span>
            &copy; {new Date().getFullYear()} 1vs1 FutDraft. -{' '}
            <span
              onClick={handleAdminClick}
              className="cursor-pointer"
              role="button"
            >
              Moonthang
            </span>
          </span>
          <a
            href="https://github.com/moonthang"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </p>
      </footer>
      
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acceso de Administrador</DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales para acceder al panel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo
              </Label>
              <Input
                id="email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="col-span-3"
                placeholder="admin@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoginSubmit()}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoginModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleLoginSubmit}>Ingresar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
