
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { TeamInfo } from '@/types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function ComparePage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "equipos"));
        const teamsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          logoUrl: doc.data().logoUrl,
          primaryColor: doc.data().primaryColor,
        })) as TeamInfo[];
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleSelectTeam = (id: string) => {
    setSelectedTeams((prev) => {
      if (prev.includes(id)) {
        return prev.filter((teamId) => teamId !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[0], id];
    });
  };
  
  const handleConfirm = () => {
    if (selectedTeams.length === 2) {
      router.push(`/lineup?teamA=${selectedTeams[0]}&teamB=${selectedTeams[1]}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 md:p-8">
      <header className="text-center mb-8 relative w-full max-w-4xl">
        <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2" onClick={() => router.push('/')}>
            <ArrowLeft />
        </Button>
        <h1 className="text-4xl font-bold text-primary">1 vs 1</h1>
        <p className="text-muted-foreground mt-2">Selecciona dos equipos para comenzar el enfrentamiento.</p>
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
                isSelected={selectedTeams.includes(team.id)}
              />
            ))
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleConfirm}
            disabled={selectedTeams.length !== 2}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Confirmar Equipos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Lineup Showdown.</p>
      </footer>
    </div>
  );
}
