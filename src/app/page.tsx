
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useLineupStore } from '@/store/lineupStore';
import { TeamRoster } from '@/components/TeamRoster';
import { FormationSelector } from '@/components/FormationSelector';
import { FootballPitch } from '@/components/FootballPitch';
import { PlayerComparisonModal } from '@/components/PlayerComparisonModal';
import { Button } from '@/components/ui/button';
import { Download, Users, LayoutDashboard, FileImage, PieChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import logo1vs1 from '@/assets/logo/1vs1.png';
import { useIsMobile } from '@/hooks/use-mobile';

let htmlToImage: typeof import('html-to-image') | null = null;

const PT_SANS_FONT_URL = "https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap";

const TEAM_A_LOGO_URL = "https://ik.imagekit.io/mdjzw07s9/teamA/millosLogo.png?updatedAt=1750285250139";
const TEAM_B_LOGO_URL = "https://ik.imagekit.io/mdjzw07s9/teamB/santafeLogo.png?updatedAt=1750285233263";

export default function LineupShowdownPage() {
  const { 
    teamA, 
    teamB, 
    selectedFormationKey, 
    getPlayerCountsInLineup,
  } = useLineupStore();
  const loadInitialData = useLineupStore(state => state.loadInitialData);
  const hydrateFromLocalStorage = useLineupStore(state => state.hydrateFromLocalStorage);
  const isHydrated = useLineupStore(state => state.isHydrated);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlotKey, setCurrentSlotKey] = useState<string | null>(null);
  const { toast } = useToast();
  const pitchRef = useRef<HTMLDivElement>(null);
  const [fontCss, setFontCss] = useState<string | null>(null);
  
  const isMobile = useIsMobile();
  const [accordionValue, setAccordionValue] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? [] : ['teamA', 'teamB'];
    }
    return ['teamA', 'teamB']; 
  });

  useEffect(() => {
    loadInitialData();
    hydrateFromLocalStorage();

    import('html-to-image').then(module => {
      htmlToImage = module;
    });

    const fetchFontCss = async () => {
      try {
        const response = await fetch(PT_SANS_FONT_URL);
        if (response.ok) {
          const cssText = await response.text();
          setFontCss(cssText);
        } else {
          console.error('Failed to fetch font CSS:', response.status);
          toast({
            title: "Error de carga de fuentes",
            description: "No se pudo cargar el CSS de las fuentes para la exportación.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching font CSS:', error);
        toast({
          title: "Error de carga de fuentes",
          description: "Ocurrió un error al cargar el CSS de las fuentes.",
          variant: "destructive",
        });
      }
    };
    fetchFontCss();
  }, [loadInitialData, hydrateFromLocalStorage, toast]);

  useEffect(() => {
    if (isMobile) {
      setAccordionValue([]);
    } else {
      setAccordionValue(['teamA', 'teamB']);
    }
  }, [isMobile]);

  const handleSlotClick = (positionSlotKey: string) => {
    setCurrentSlotKey(positionSlotKey);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSlotKey(null);
  };

  const handleExportLineup = async () => {
    if (!htmlToImage) {
      toast({
        title: "Error de Exportación",
        description: "La funcionalidad de exportación de imágenes aún no se ha cargado. Por favor, inténtalo de nuevo en un momento.",
        variant: "destructive",
      });
      return;
    }
    if (!fontCss) {
      toast({
        title: "Error de Exportación",
        description: "Las fuentes para la imagen aún no se han cargado. Por favor, inténtalo de nuevo en un momento.",
        variant: "destructive",
      });
      return;
    }

    const pitchElement = document.getElementById('football-pitch-container');
    if (pitchElement) {
      try {
        const dataUrl = await htmlToImage.toPng(pitchElement, { 
          pixelRatio: 2,
          fontEmbedCSS: fontCss,
        });
        const link = document.createElement('a');
        link.download = `alineacion-${selectedFormationKey || '1vs1'}.png`;
        link.href = dataUrl;
        link.click();
        
      } catch (error) {
        console.error('Fallo al exportar alineación:', error);
        toast({
          title: "Exportación Fallida",
          description: "No se pudo generar la imagen de la alineación. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    } else {
       toast({
        title: "Error de Exportación",
        description: "No se pudo encontrar el elemento del campo para exportar.",
        variant: "destructive",
      });
    }
  };

  const { teamACount, teamBCount } = getPlayerCountsInLineup();

  let winningTeamDisplay;
  let winningTeamLogoUrl = null;

  if (teamACount > teamBCount) {
    winningTeamDisplay = <span className="text-primary font-semibold">{teamA.name}</span>;
    winningTeamLogoUrl = TEAM_A_LOGO_URL;
  } else if (teamBCount > teamACount) {
    winningTeamDisplay = <span className="text-red-600 font-semibold">{teamB.name}</span>;
    winningTeamLogoUrl = TEAM_B_LOGO_URL;
  } else {
    winningTeamDisplay = <span className="text-foreground font-semibold">Empate</span>;
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Cargando...
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground px-4 md:px-8 pt-2 md:pt-4 pb-4 md:pb-8">
      <header className="mb-0 text-center">
        <div className="flex justify-center">
          <Image src={logo1vs1} alt="1 VS 1 Logo" width={50} height={61} priority />
        </div>
        <p className="text-muted-foreground mt-1">1 vs 1 Millonarios - Santa Fe</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <aside className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><Users className="mr-2 h-5 w-5"/>Plantillas de Equipos</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion 
                type="multiple" 
                value={accordionValue}
                onValueChange={setAccordionValue}
                className="w-full"
              >
                <AccordionItem value="teamA">
                  <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                    <div className="flex items-center">
                      <Image src={TEAM_A_LOGO_URL} alt={`${teamA.name} logo`} width={24} height={24} className="mr-2 rounded-sm" unoptimized />
                      {teamA.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TeamRoster players={teamA.players} teamName={teamA.name} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="teamB">
                  <AccordionTrigger className="font-headline text-lg text-primary hover:no-underline">
                     <div className="flex items-center">
                      <Image src={TEAM_B_LOGO_URL} alt={`${teamB.name} logo`} width={24} height={24} className="mr-2 rounded-sm" unoptimized />
                      {teamB.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <TeamRoster players={teamB.players} teamName={teamB.name} />
                  </AccordionContent>
                </AccordionItem>
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
              <div ref={pitchRef} id="football-pitch-container" className="mt-4">
                <FootballPitch onSlotClick={handleSlotClick} />
              </div>
            </CardContent>
          </Card>
        </main>
        
        <aside className="lg:col-span-3 space-y-6">
           <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><FileImage className="mr-2 h-5 w-5"/>Exportar Alineación</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportLineup} 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
                disabled={!htmlToImage || !fontCss}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar como Imagen
              </Button>
               {(!htmlToImage || !fontCss) && <p className="text-xs text-muted-foreground mt-2 text-center">Cargando exportación...</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-headline text-primary"><PieChart className="mr-2 h-5 w-5"/>Resumen de Alineación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Image src={TEAM_A_LOGO_URL} alt={`${teamA.name} logo`} width={20} height={20} className="mr-2 rounded-sm" unoptimized />
                    <span className="text-foreground font-medium">{teamA.name}:</span>
                  </div>
                  <span className="text-primary font-semibold">{teamACount} jugadores</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center">
                    <Image src={TEAM_B_LOGO_URL} alt={`${teamB.name} logo`} width={20} height={20} className="mr-2 rounded-sm" unoptimized />
                    <span className="text-foreground font-medium">{teamB.name}:</span>
                  </div>
                  <span className="text-red-600 font-semibold">{teamBCount} jugadores</span>
                </div>
                <hr className="my-1 border-border"/>
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium flex items-center"><Trophy className="mr-2 h-4 w-4 text-yellow-500"/>Equipo Ganador:</span>
                  {winningTeamDisplay}
                </div>
                {winningTeamLogoUrl && (
                  <div className="flex justify-end mt-1">
                    <Image src={winningTeamLogoUrl} alt="Winning team logo" width={28} height={28} className="rounded-sm" unoptimized />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <PlayerComparisonModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        positionSlotKey={currentSlotKey}
      />
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 1 VS 1.</p>
      </footer>
    </div>
  );
}

