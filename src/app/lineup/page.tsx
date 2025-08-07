"use client";

import { useEffect, useState, Suspense, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLineupStore } from '@/store/lineupStore';
import type { Player, Team } from '@/types';
import { TeamRoster } from '@/components/TeamRoster';
import { FormationSelector } from '@/components/FormationSelector';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerComparisonModal } from '@/components/PlayerComparisonModal';
import { TopStatCard } from '@/components/TopStatCard';
import { Button, buttonVariants } from '@/components/ui/button';
import { Download, Users, LayoutDashboard, FileImage, PieChart, Trophy, ArrowLeft, Ban, Goal, Handshake, Star, ShieldCheck, Info, Cake, Globe, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import logo1vs1 from '@/assets/logo/1vs1.png';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { cn, calculateAge } from '@/lib/utils';
import { Input } from '@/components/ui/input';

let htmlToImage: typeof import('html-to-image') | null = null;
const PT_SANS_FONT_URL = "https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap";

const TeamStatsDisplay = ({ stats }: { stats: ReturnType<typeof useTeamStats> }) => {
  if (!stats) return null;
  return (
    <div className="space-y-2 text-sm p-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /><span>Jugadores Totales</span></div>
        <span className="font-semibold text-primary">{stats.totalPlayers}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground"><Cake className="h-4 w-4" /><span>Edad Media</span></div>
        <span className="font-semibold text-primary">{stats.averageAge} años</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /><span>Extranjeros</span></div>
        <span className="font-semibold text-primary">{stats.foreignPlayers}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground"><Baby className="h-4 w-4" /><span>Sub-20</span></div>
        <span className="font-semibold text-primary">{stats.u20Players}</span>
      </div>
    </div>
  );
};

const useTeamStats = (team: Team | null) => {
    return useMemo(() => {
        if (!team?.players) return null;

        const playersWithAge = team.players
            .map(p => ({ ...p, age: calculateAge(p.birthDate) }))
            .filter(p => p.age !== null);

        const totalAge = playersWithAge.reduce((sum, p) => sum + (p.age as number), 0);
        const averageAge = playersWithAge.length > 0 ? (totalAge / playersWithAge.length).toFixed(1) : 'N/A';

        const foreignPlayers = team.players.filter(p => p.nationality && p.nationality !== 'CO').length;
        
        const u20Players = playersWithAge.filter(p => (p.age as number) < 20).length;

        return {
            totalPlayers: team.players.length,
            averageAge,
            foreignPlayers,
            u20Players,
        };
    }, [team?.players]);
};


function LineupShowdownComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    teamA, 
    teamB, 
    selectedFormationKey, 
    getPlayerCountsInLineup,
    isHydrated,
    isLoading,
    loadTeams,
    isComparisonMode,
    idealLineup,
    setPlayerInLineup,
    isBenchVisible,
    toggleBenchVisibility,
  } = useLineupStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlotKey, setCurrentSlotKey] = useState<string | null>(null);
  const { toast } = useToast();
  const [fontCss, setFontCss] = useState<string | null>(null);
  
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  
  const teamAStats = useTeamStats(teamA);
  const teamBStats = useTeamStats(teamB);


  useEffect(() => {
    const teamAId = searchParams.get('teamA');
    const teamBId = searchParams.get('teamB');
    if (teamAId) {
      loadTeams(teamAId, teamBId || undefined);
    } else {
      router.push('/');
    }

    import('html-to-image').then(module => {
      htmlToImage = module;
    });

    const fetchFontCss = async () => {
      try {
        const response = await fetch(PT_SANS_FONT_URL);
        if (response.ok) setFontCss(await response.text());
      } catch (error) {
        console.error('Error fetching font CSS:', error);
      }
    };
    fetchFontCss();
  }, []);

  useEffect(() => {
    if (!isLoading && !isComparisonMode && teamA?.coach && !idealLineup['COACH_SLOT']) {
      const coachAsPlayer: Player = {
        id: `coach_${teamA.id}`,
        name: teamA.coach.name,
        jerseyNumber: 0,
        position: 'DT',
        stats: {},
        imageUrl: teamA.coach.imageUrl || '',
        teamId: teamA.id,
      };
      setPlayerInLineup('COACH_SLOT', coachAsPlayer);
    }
  }, [isLoading, isComparisonMode, teamA, idealLineup, setPlayerInLineup]);

  const handleSlotClick = (positionSlotKey: string) => {
    setCurrentSlotKey(positionSlotKey);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);

  const handleExportLineup = async () => {
    if (!htmlToImage || !fontCss) {
      toast({ title: "Error de Exportación", description: "La funcionalidad de exportación aún no se ha cargado.", variant: "destructive" });
      return;
    }
    const elementToExport = document.getElementById('football-pitch-and-bench-container');
    if (elementToExport) {
      try {
        const dataUrl = await htmlToImage.toPng(elementToExport, { pixelRatio: 2, fontEmbedCSS: fontCss });
        const link = document.createElement('a');
        link.download = `alineacion-${selectedFormationKey || '1vs1'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Fallo al exportar alineación:', error);
        toast({ title: "Exportación Fallida", description: "No se pudo generar la imagen.", variant: "destructive" });
      }
    }
  };

  const findTopPlayer = (players: Player[], stat: keyof Player['stats'], mustBePositive = false) => {
    const playersWithStat = players.filter(p => 
      p.stats?.[stat] !== undefined && 
      p.stats?.[stat] !== null &&
      (!mustBePositive || (p.stats[stat] as number) > 0)
    );

    if (playersWithStat.length === 0) return null;

    return playersWithStat.reduce((top, current) => {
        return ((current.stats?.[stat] as number) > (top.stats?.[stat] as number)) ? current : top;
    });
  };

  const allPlayers = useMemo(() => {
    if (!teamA) return [];
    return isComparisonMode && teamB ? [...teamA.players, ...teamB.players] : [...teamA.players];
  }, [teamA, teamB, isComparisonMode]);
  
  const topScorer = useMemo(() => findTopPlayer(allPlayers, 'Goles', true), [allPlayers]);
  const topAssister = useMemo(() => findTopPlayer(allPlayers, 'Asistencia', true), [allPlayers]);
  const topRated = useMemo(() => findTopPlayer(allPlayers, 'Sofascore'), [allPlayers]);
  const topCleanSheeter = useMemo(() => findTopPlayer(allPlayers.filter(p => p.position === 'Portero'), 'Arcos en cero', true), [allPlayers]);

  const getTeamById = (teamId: string): Team | null => {
    if (teamA?.id === teamId) return teamA;
    if (teamB?.id === teamId) return teamB;
    return null;
  }

  if (isLoading || !isHydrated || !teamA) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Image
          src={logo1vs1}
          alt="1 VS 1 Logo"
          width={80}
          height={98}
          priority
          className="animate-scale-in-out"
        />
        <p className="text-lg">Cargando equipo...</p>
      </div>
    );
  }

  const { teamACount, teamBCount } = getPlayerCountsInLineup();
  const teamAColor = teamA?.primaryColor || '#1A237E';
  const teamBColor = (() => {
    if (!teamB) return '#E53935';
    if (teamA?.primaryColor && teamA.primaryColor !== teamB.primaryColor) {
      return teamB.primaryColor || '#E53935';
    }
    return teamB.secondaryColor || '#E53935';
  })();
  
  let winningTeamDisplay;
  if (teamACount > teamBCount) winningTeamDisplay = <span style={{ color: teamAColor }} className="font-semibold">{teamA.name}</span>;
  else if (teamBCount > teamACount && teamB) winningTeamDisplay = <span style={{ color: teamBColor }} className="font-semibold">{teamB.name}</span>;
  else winningTeamDisplay = <span className="text-foreground font-semibold">Empate</span>;
  
  const winningTeamLogoUrl = teamACount > teamBCount ? teamA.logoUrl : (teamBCount > teamACount && teamB ? teamB.logoUrl : null);

  const pageTitle = isComparisonMode && teamB ? `${teamA.name} vs ${teamB.name}` : `Armando Alineación de ${teamA.name}`;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 pt-2 md:pt-4 pb-4 md:pb-8">
      <header className="mb-0 flex w-full items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <div className="text-center">
            <div className="flex justify-center">
              <Image src={logo1vs1} alt="1 VS 1 Logo" width={50} height={61} priority />
            </div>
            <p className="text-muted-foreground mt-1">{pageTitle}</p>
        </div>
        <div className="w-10" />
      </header>

       <div className="grid grid-cols-1 lg:grid-cols-[324px_530px_255px] gap-6 mt-8">
        <aside className="space-y-6 lg:w-[324px]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><Users className="mr-2 h-5 w-5"/>Plantillas</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="w-full">
                <AccordionItem value="teamA">
                    <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center overflow-hidden">
                                <Image src={teamA.logoUrl!} alt={`${teamA.name} logo`} width={24} height={24} className="mr-2 rounded-sm flex-shrink-0"  />
                                <span className="truncate">{teamA.name}</span>
                            </div>
                            {teamAStats && (
                                <Popover>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div 
                                                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 rounded-full hover:bg-primary/10 flex-shrink-0")}
                                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                >
                                                  <PopoverTrigger asChild>
                                                      <div><Info className="h-4 w-4 text-primary/70" /></div>
                                                  </PopoverTrigger>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Estadísticas</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
                                        <TeamStatsDisplay stats={teamAStats} />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </AccordionTrigger>
                  <AccordionContent>
                    <TeamRoster players={teamA.players} teamName={teamA.name} />
                  </AccordionContent>
                </AccordionItem>
                {isComparisonMode && teamB && (
                  <AccordionItem value="teamB">
                    <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                       <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center overflow-hidden">
                                <Image src={teamB.logoUrl!} alt={`${teamB.name} logo`} width={24} height={24} className="mr-2 rounded-sm flex-shrink-0"  />
                                <span className="truncate">{teamB.name}</span>
                            </div>
                            {teamBStats && (
                                <Popover>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div 
                                                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-7 w-7 rounded-full hover:bg-primary/10 flex-shrink-0")}
                                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                >
                                                  <PopoverTrigger asChild>
                                                    <div><Info className="h-4 w-4 text-primary/70" /></div>
                                                  </PopoverTrigger>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Estadísticas</p></TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
                                        <TeamStatsDisplay stats={teamBStats} />
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <TeamRoster players={teamB.players} teamName={teamB.name} />
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>

          {topScorer && (
            <TopStatCard
              title="Goleador"
              player={topScorer}
              team={topScorer ? getTeamById(topScorer.teamId) : null}
              statValue={topScorer?.stats?.Goles}
              icon={<Goal className="mr-2 h-4 w-4 text-green-500" />}
            />
          )}
          {topAssister && (
            <TopStatCard
              title="Asistidor"
              player={topAssister}
              team={topAssister ? getTeamById(topAssister.teamId) : null}
              statValue={topAssister?.stats?.Asistencia}
              icon={<Handshake className="mr-2 h-4 w-4 text-teal-500" />}
            />
          )}
          {topRated && (
            <TopStatCard
              title="Mejor Rating"
              player={topRated}
              team={topRated ? getTeamById(topRated.teamId) : null}
              statValue={topRated?.stats?.Sofascore}
              icon={<Star className="mr-2 h-4 w-4 text-amber-500" />}
            />
          )}
          {topCleanSheeter && (
            <TopStatCard
              title="Arcos en Cero"
              player={topCleanSheeter}
              team={topCleanSheeter ? getTeamById(topCleanSheeter.teamId) : null}
              statValue={topCleanSheeter?.stats?.['Arcos en cero']}
              icon={<ShieldCheck className="mr-2 h-4 w-4 text-blue-500" />}
            />
          )}
        </aside>

        <main className="flex flex-col items-center lg:w-[530px]">
          <Card className="w-full">
            <CardHeader className="pb-2">
               <CardTitle className="flex items-center text-lg font-headline text-primary"><LayoutDashboard className="mr-2 h-5 w-5"/>Formación</CardTitle>
            </CardHeader>
            <CardContent>
              <FormationSelector />
              <FootballPitch onSlotClick={handleSlotClick} />
            </CardContent>
          </Card>
        </main>
        
        <aside className="space-y-6 lg:w-[255px]">
           <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><LayoutDashboard className="mr-2 h-5 w-5"/>Opciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bench-toggle" className="flex items-center gap-2 cursor-pointer">
                    <Ban className="h-4 w-4" />
                    <span>Ocultar Banquillo</span>
                  </Label>
                  <Switch
                    id="bench-toggle"
                    checked={!isBenchVisible}
                    onCheckedChange={toggleBenchVisibility}
                  />
                </div>
                <div className="flex items-center justify-between">
                   <Label className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    <span>Exportar Imagen</span>
                  </Label>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={handleExportLineup} 
                    disabled={!htmlToImage || !fontCss}
                    aria-label="Exportar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(!htmlToImage || !fontCss) && <p className="text-xs text-muted-foreground mt-2 text-center">Cargando...</p>}
            </CardContent>
          </Card>

          {isComparisonMode && teamB && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg font-headline text-primary"><PieChart className="mr-2 h-5 w-5"/>Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Image src={teamA.logoUrl!} alt={`${teamA.name} logo`} width={20} height={20} className="mr-2 rounded-sm"  />
                      <span className="text-foreground font-medium">{teamA.name}:</span>
                    </div>
                    <span className="font-semibold" style={{ color: teamAColor }}>{teamACount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center">
                      <Image src={teamB.logoUrl!} alt={`${teamB.name} logo`} width={20} height={20} className="mr-2 rounded-sm"  />
                      <span className="text-foreground font-medium">{teamB.name}:</span>
                    </div>
                    <span className="font-semibold" style={{ color: teamBColor }}>{teamBCount}</span>
                  </div>
                  <hr className="my-1 border-border"/>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground font-medium flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500"/>Ganador:</span>
                    {winningTeamDisplay}
                  </div>
                  {winningTeamLogoUrl && (
                    <div className="flex justify-end mt-1">
                      <Image src={winningTeamLogoUrl} alt="Winning team logo" width={28} height={28} className="rounded-sm"  />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {teamA && <PlayerComparisonModal isOpen={isModalOpen} onClose={handleCloseModal} positionSlotKey={currentSlotKey} />}
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 1vs1 FutDraft.</p>
      </footer>
      <ScrollToTopButton />
    </div>
  );
}

export default function LineupShowdownPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
                <Image
                  src={logo1vs1}
                  alt="1 VS 1 Logo"
                  width={80}
                  height={98}
                  priority
                  className="animate-scale-in-out"
                />
                <p className="text-lg">Cargando enfrentamiento...</p>
            </div>
        }>
            <LineupShowdownComponent />
        </Suspense>
    )
}

    
