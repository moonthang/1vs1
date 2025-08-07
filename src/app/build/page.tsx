'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CalendarClock } from 'lucide-react';
import type { TeamInfo } from '@/types';
import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';

function TeamSelectionCard({
  team,
  onSelect,
  isSelected,
}: {
  team: TeamInfo;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      onClick={() => onSelect(team.id)}
      style={isSelected ? { '--tw-ring-color': team.primaryColor || 'hsl(var(--primary))' } as React.CSSProperties : {}}
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <CardContent className="flex flex-col items-center justify-center p-4 gap-4">
        <Image
          src={team.logoUrl}
          alt={`${team.name} logo`}
          width={80}
          height={80}
          className="object-contain h-20"
          
        />
        <h3 className="text-lg font-semibold text-center text-foreground">{team.name}</h3>
      </CardContent>
    </Card>
  );
}

export default function BuildPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamsAndMeta = async () => {
      setIsLoading(true);
      try {
        const teamsQuerySnapshot = await getDocs(collection(db, "equipos"));
        const teamsData = teamsQuerySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          logoUrl: doc.data().logoUrl,
          primaryColor: doc.data().primaryColor,
        })) as TeamInfo[];
        setTeams(teamsData);
        
        const metaDocRef = doc(db, 'app_meta', 'info');
        const metaDoc = await getDoc(metaDocRef);
        if (metaDoc.exists() && metaDoc.data().lastUpdated) {
          const timestamp = metaDoc.data().lastUpdated as Timestamp;
          setLastUpdated(timestamp.toDate().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
        }

      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeamsAndMeta();
  }, []);

  const handleSelectTeam = (id: string) => {
    setSelectedTeam((prev) => (prev === id ? null : id));
  };
  
  const handleConfirm = () => {
    if (selectedTeam) {
      router.push(`/lineup?teamA=${selectedTeam}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8">
      <header className="mb-8 flex w-full max-w-4xl flex-col items-center">
        <div className="flex w-full items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft />
            </Button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary">Arma tu Equipo</h1>
              <p className="text-muted-foreground mt-2">Selecciona un equipo para armar su alineación.</p>
            </div>
            <div className="w-10" />
        </div>
        {lastUpdated && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
                <CalendarClock className="h-4 w-4" />
                <span>Plantillas actualizadas por última vez el: <strong>{lastUpdated}</strong></span>
            </div>
        )}
      </header>

      <main className="w-full max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center justify-center p-4 gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-6 w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : (
            teams.map((team) => (
              <TeamSelectionCard
                key={team.id}
                team={team}
                onSelect={handleSelectTeam}
                isSelected={selectedTeam === team.id}
              />
            ))
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleConfirm}
            disabled={!selectedTeam}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Construir Alineación
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 1vs1 FutDraft.</p>
      </footer>
      <ScrollToTopButton />
    </div>
  );
}
