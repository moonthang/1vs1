
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLineupStore } from '@/store/lineupStore';
import type { Player } from '@/types';
import { TeamRoster } from '@/components/TeamRoster';
import { FormationSelector } from '@/components/FormationSelector';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerComparisonModal } from '@/components/PlayerComparisonModal';
import { Button } from '@/components/ui/button';
import { Download, Users, LayoutDashboard, FileImage, PieChart, Trophy, ArrowLeft, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import logo1vs1 from '@/assets/logo/1vs1.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

let htmlToImage: typeof import('html-to-image') | null = null;
const PT_SANS_FONT_URL = "https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap";

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
  
  const isMobile = useIsMobile();
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

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
    if (!isLoading) {
       if (isMobile) setAccordionValue([]);
       else setAccordionValue(['teamA', 'teamB']);
    }
  }, [isMobile, isLoading]);

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
      <header className="mb-0 text-center relative">
        <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <div className="flex justify-center">
          <Image src={logo1vs1} alt="1 VS 1 Logo" width={50} height={61} priority />
        </div>
        <p className="text-muted-foreground mt-1">{pageTitle}</p>
      </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <aside className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><Users className="mr-2 h-5 w-5"/>Plantillas</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="w-full">
                <AccordionItem value="teamA">
                  <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                    <div className="flex items-center">
                      <Image src={teamA.logoUrl!} alt={`${teamA.name} logo`} width={24} height={24} className="mr-2 rounded-sm"  />
                      {teamA.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TeamRoster players={teamA.players} teamName={teamA.name} />
                  </AccordionContent>
                </AccordionItem>
                {isComparisonMode && teamB && (
                  <AccordionItem value="teamB">
                    <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                       <div className="flex items-center">
                        <Image src={teamB.logoUrl!} alt={`${teamB.name} logo`} width={24} height={24} className="mr-2 rounded-sm"  />
                        {teamB.name}
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
        </aside>

        <main className="lg:col-span-6 flex flex-col items-center">
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
        
        <aside className="lg:col-span-3 space-y-6">
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
                    <span>Exportar como Imagen</span>
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
