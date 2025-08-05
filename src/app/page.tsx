
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Github, Swords, Users, BarChart3, Loader2 } from 'lucide-react';
import logo1vs1 from '@/assets/logo/1vs1.png';
import armarEquipoImg from '@/assets/img/armar.jpg';
import comparativaImg from '@/assets/img/1vs1.jpg';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import type { Player, Team } from '@/types';
import { countryMap } from '@/data/countries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

const StatsDialog = ({ isOpen, onClose, players, teamsMap }: { isOpen: boolean, onClose: () => void, players: Player[], teamsMap: Map<string, {name: string, logoUrl: string}> }) => {
    
    const statsCategories: { key: keyof Player['stats']; title: string; unit?: string }[] = [
        { key: 'Goles', title: 'Goleadores' },
        { key: 'Asistencia', title: 'Asistidores' },
        { key: 'Arcos en cero', title: 'Vallas Invictas' },
        { key: 'Goles recibidos', title: 'Goles Recibidos' },
    ];
    
    const [selectedStat, setSelectedStat] = useState<keyof Player['stats']>(statsCategories[0].key);
    const isMobile = useIsMobile();

    const getStat = (player: Player, stat: keyof Player['stats']): number => {
        const value = player.stats?.[stat];
        return typeof value === 'number' ? value : 0;
    };

    const getRankedPlayers = (stat: keyof Player['stats']) => {
        const positionFilter = stat === 'Arcos en cero' || stat === 'Goles recibidos' ? 'Portero' : undefined;
        return players
            .filter(p => {
                const statValue = getStat(p, stat);
                const hasStat = statValue > 0;
                const positionMatch = positionFilter ? p.position === positionFilter : true;
                return hasStat && positionMatch;
            })
            .sort((a, b) => getStat(b, stat) - getStat(a, stat));
    };

    const renderTableRows = (stat: keyof Player['stats']) => {
        const rankedPlayers = getRankedPlayers(stat);
        if (rankedPlayers.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No hay jugadores para mostrar en esta categoría.
                    </TableCell>
                </TableRow>
            )
        }
        return (
            <>
                {rankedPlayers.map((player, index) => {
                    const team = teamsMap.get(player.teamId);
                    const country = countryMap.get(player.nationality || '');
                    const uniqueKey = `${player.id}-${player.teamId}`;
                    return (
                        <TableRow key={uniqueKey}>
                            <TableCell className="w-[50px] px-2 font-bold align-middle text-center">{index + 1}</TableCell>
                            <TableCell className="px-1 align-middle w-[150px]">
                                <div className="flex items-center gap-2">
                                    {country && <Image src={country.flag} alt={country.label} width={20} height={15} className="border border-muted" />}
                                    <span className="font-medium truncate">{player.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="w-[70px] px-2 text-center align-middle">
                                {team && <Image src={team.logoUrl} alt={team.name} width={24} height={24} className="mx-auto" />}
                            </TableCell>
                            <TableCell className="w-[60px] px-2 text-right font-bold text-lg text-primary align-middle">{String(getStat(player, stat))}</TableCell>
                        </TableRow>
                    )
                })}
            </>
        );
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
             <DialogContent className="flex flex-col max-h-[80vh] p-0">
                <DialogHeader className="px-4 pt-4 pb-0 flex-shrink-0 bg-card">
                    <DialogTitle className="text-2xl font-bold text-primary text-center">Estadísticas</DialogTitle>
                </DialogHeader>
                
                <div className="px-4">
                 {isMobile ? (
                    <div className="pt-2">
                        <Select value={selectedStat} onValueChange={(value) => setSelectedStat(value as keyof Player['stats'])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una estadística" />
                            </SelectTrigger>
                            <SelectContent>
                                {statsCategories.map(cat => (
                                    <SelectItem key={cat.key.toString()} value={cat.key.toString()}>{cat.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                     <Tabs value={selectedStat} onValueChange={(value) => setSelectedStat(value as keyof Player['stats'])} className="w-full pt-2">
                        <TabsList className="flex flex-wrap h-auto justify-center">
                            {statsCategories.map(cat => (
                                <TabsTrigger key={cat.key} value={cat.key} className="flex-1">
                                    {cat.title}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}
                </div>
                
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 flex-shrink-0">
                        <Table className="table-fixed">
                            <TableHeader className="bg-card sticky top-0">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50px] px-2 text-center">Rank</TableHead>
                                    <TableHead className="w-[150px] px-1">Jugador</TableHead>
                                    <TableHead className="w-[70px] px-2 text-center">Equipo</TableHead>
                                    <TableHead className="w-[60px] px-2 text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                        </Table>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4">
                        <Table className="table-fixed">
                            <TableBody>
                                {isMobile ? renderTableRows(selectedStat) : renderTableRows(selectedStat)}
                            </TableBody>
                        </Table>
                    </div>
                </div>


                <DialogFooter className="p-4 pt-2 flex-shrink-0 border-t">
                    <Button variant="outline" onClick={onClose} className="w-auto">Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function LandingPage() {
  const router = useRouter();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teamsMap, setTeamsMap] = useState<Map<string, {name: string, logoUrl: string}>>(new Map());
  const [isStatsLoading, setIsStatsLoading] = useState(false);

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

  const handleStatsClick = async () => {
    if (allPlayers.length > 0) {
        setIsStatsModalOpen(true);
        return;
    }
    
    setIsStatsLoading(true);
    try {
        const teamsSnapshot = await getDocs(collection(db, 'equipos'));
        
        const players: Player[] = [];
        const teams = new Map<string, {name: string, logoUrl: string}>();

        teamsSnapshot.forEach(doc => {
          const team = doc.data() as Team;
          teams.set(doc.id, { name: team.name, logoUrl: team.logoUrl || '' });
          if (team.players && Array.isArray(team.players)) {
            team.players.forEach(player => {
              players.push({
                ...player,
                teamId: doc.id
              });
            });
          }
        });

        setAllPlayers(players);
        setTeamsMap(teams);
        setIsStatsModalOpen(true);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las estadísticas.' });
    } finally {
        setIsStatsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8 relative">
      <header className="text-center mb-5 max-w-3xl">
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
              className="w-full"
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
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label="Iniciar Comparación"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-11 text-center text-sm text-muted-foreground">
        <div className="my-4">
             <Button 
                variant="outline" 
                onClick={handleStatsClick} 
                disabled={isStatsLoading} 
                className="text-primary border-primary hover:bg-background hover:text-primary"
              >
                {isStatsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                Estadísticas
            </Button>
        </div>
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
              Introduce tus credenciales para acceder al panel.
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
      
      {isStatsModalOpen && (
        <StatsDialog
            isOpen={isStatsModalOpen}
            onClose={() => setIsStatsModalOpen(false)}
            players={allPlayers}
            teamsMap={teamsMap}
        />
      )}
    </div>
  );
}
