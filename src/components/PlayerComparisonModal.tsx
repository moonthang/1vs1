"use client";

import type { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useLineupStore } from '@/store/lineupStore';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionSlotKey: string | null;
}

type SortCriteria = 'Partidos' | 'Sofascore' | 'Goles' | 'Asistencia' | 'Arcos en cero';

const sortOptions: { value: SortCriteria; label: string }[] = [
  { value: 'Partidos', label: 'Partidos Jugados' },
  { value: 'Sofascore', label: 'Sofascore Rating' },
  { value: 'Goles', label: 'Goles' },
  { value: 'Asistencia', label: 'Asistencias' },
  { value: 'Arcos en cero', label: 'Arcos en Cero' },
];

export function PlayerComparisonModal({ isOpen, onClose, positionSlotKey }: PlayerComparisonModalProps) {
  const { teamA, teamB, getEligiblePlayersForSlot, setPlayerInLineup, idealLineup, clearPlayerFromLineup, isComparisonMode } = useLineupStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerForSlot, setSelectedPlayerForSlot] = useState<Player | null>(null);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('Partidos');

  useEffect(() => {
    if (isOpen && positionSlotKey) {
      setSelectedPlayerForSlot(idealLineup[positionSlotKey] || null);
    }
    if (!isOpen) {
      setSearchTerm('');
      setSortCriteria('Partidos'); 
    }
  }, [isOpen, positionSlotKey, idealLineup]);

  const handlePlayerSelect = (player: Player) => {
    if (positionSlotKey) {
      const isPlayerAlreadySelectedElsewhere = Object.entries(idealLineup).some(
        ([key, p]) => p?.id === player.id && key !== positionSlotKey
      );

      if (!isPlayerAlreadySelectedElsewhere) {
        setPlayerInLineup(positionSlotKey, player);
        onClose();
      }
    }
  };

  const handleRemovePlayer = () => {
    if (positionSlotKey) {
      clearPlayerFromLineup(positionSlotKey);
      onClose();
    }
  };

  const isSubstituteSlot = positionSlotKey?.startsWith('SUB_');
  const isCoachSlot = positionSlotKey === 'COACH_SLOT';
  const currentFormation = useLineupStore(state => state.formations.find(f => f.key === state.selectedFormationKey));
  const currentPositionSlot = !isSubstituteSlot && !isCoachSlot ? currentFormation?.positions.find(p => p.key === positionSlotKey) : null;

  const sortPlayers = useCallback((players: Player[], criteria: SortCriteria): Player[] => {
    if (!Array.isArray(players) || isCoachSlot) {
      return players || [];
    }
    return [...players].sort((a, b) => {
      const statA = a.stats?.[criteria] ?? (criteria === 'Sofascore' ? 0 : -Infinity); 
      const statB = b.stats?.[criteria] ?? (criteria === 'Sofascore' ? 0 : -Infinity);
      
      return (statB as number) - (statA as number);
    });
  }, [isCoachSlot]);

  const getProcessedPlayers = useCallback((allTeamPlayers: Player[] | undefined, eligibleSlotPlayers: Player[]): Player[] => {
    let playersToDisplay: Player[];
    if (!Array.isArray(allTeamPlayers)) allTeamPlayers = [];
    if (!Array.isArray(eligibleSlotPlayers)) eligibleSlotPlayers = [];
    
    if (searchTerm.trim() !== '') {
      const allPlayers = isCoachSlot ? eligibleSlotPlayers : allTeamPlayers;
      playersToDisplay = allPlayers.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      playersToDisplay = eligibleSlotPlayers;
    }
    return sortPlayers(playersToDisplay, sortCriteria);
  }, [searchTerm, sortPlayers, sortCriteria, isCoachSlot]);

  const { teamAPlayers: eligibleTeamAPlayers, teamBPlayers: eligibleTeamBPlayers } = useMemo(() => {
    if (!positionSlotKey) return { teamAPlayers: [], teamBPlayers: [] };
    return getEligiblePlayersForSlot(positionSlotKey);
  }, [positionSlotKey, getEligiblePlayersForSlot]);


  const displayedTeamAPlayers = useMemo(() => {
    return getProcessedPlayers(teamA?.players, eligibleTeamAPlayers);
  }, [teamA?.players, eligibleTeamAPlayers, getProcessedPlayers]);

  const displayedTeamBPlayers = useMemo(() => {
    return getProcessedPlayers(teamB?.players, eligibleTeamBPlayers);
  }, [teamB?.players, eligibleTeamBPlayers, getProcessedPlayers]);


  if (!isOpen || !positionSlotKey || !teamA) return null;
  if (!isSubstituteSlot && !isCoachSlot && !currentPositionSlot) return null;


  const noPlayersTeamA = displayedTeamAPlayers.length === 0;
  const noPlayersTeamB = displayedTeamBPlayers.length === 0;

  const initialTab = searchTerm.trim() !== ''
    ? (displayedTeamAPlayers.length > 0 ? "teamA" : (displayedTeamBPlayers.length > 0 ? "teamB" : "teamA"))
    : (eligibleTeamAPlayers.length > 0 ? "teamA" : (eligibleTeamBPlayers.length > 0 ? "teamB" : "teamA"));


  const renderPlayerList = (players: Player[], teamName: string) => {
    if (players.length === 0) {
       return (
         <p className="text-center text-muted-foreground py-4">
           {searchTerm ? `No se encontraron jugadores de ${teamName} con "${searchTerm}".` : `No hay jugadores elegibles de ${teamName} para esta posición y criterio.`}
         </p>
       );
    }
    return (
      <div className="space-y-2">
        {players.map((player) => {
          const isSelectedInCurrentSlot = selectedPlayerForSlot?.id === player.id;
          const isSelectedElsewhere = Object.entries(idealLineup).some(
            ([key, p]) => p?.id === player.id && key !== positionSlotKey
          );

          return (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={isSelectedElsewhere ? undefined : handlePlayerSelect}
              isSelected={isSelectedInCurrentSlot}
              isUnavailable={isSelectedElsewhere}
              showStats={true}
            />
          );
        })}
      </div>
    );
  };

  let modalTitle;
  if (isCoachSlot) {
      modalTitle = 'Seleccionar Director Técnico';
  } else if (isSubstituteSlot) {
    modalTitle = 'Seleccionar Suplente';
  } else if (currentPositionSlot) {
      let displayPositionType = currentPositionSlot.type;
      if (currentPositionSlot.label === 'MD' && currentPositionSlot.type === 'Mediocampista') displayPositionType = 'Mediocampista Derecho';
      else if (currentPositionSlot.label === 'MI' && currentPositionSlot.type === 'Mediocampista') displayPositionType = 'Mediocampista Izquierdo';
      else if (currentPositionSlot.label === 'LI' && currentPositionSlot.type === 'Defensa') displayPositionType = 'Lateral Izquierdo';
      else if (currentPositionSlot.label === 'LD' && currentPositionSlot.type === 'Defensa') displayPositionType = 'Lateral Derecho';
      else if (currentPositionSlot.label === 'CAD' && currentPositionSlot.type === 'Mediocampista') displayPositionType = 'Carrilero';
      else if (currentPositionSlot.label === 'CAI' && currentPositionSlot.type === 'Mediocampista') displayPositionType = 'Carrilero';
      else if (currentPositionSlot.label === 'MCD' && currentPositionSlot.type === 'Mediocampista') displayPositionType = 'Mediocampista Defensivo';
      else if (currentPositionSlot.label === 'ED' && currentPositionSlot.type === 'Delantero') displayPositionType = 'Extremo Derecho';
      else if (currentPositionSlot.label === 'EI' && currentPositionSlot.type === 'Delantero') displayPositionType = 'Extremo Izquierdo';
      
      modalTitle = `Seleccionar Jugador para ${currentPositionSlot.label} (${displayPositionType})`;
  } else {
    modalTitle = 'Seleccionar Jugador';
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card p-4">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary pr-8">
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-2 my-3 items-stretch md:items-end">
          <div className="flex-grow">
            <Label htmlFor="search-player" className="sr-only">Buscar Jugador</Label>
            <Input
              id="search-player"
              type="search"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          {!isCoachSlot && (
            <div className="flex-shrink-0">
              <Label htmlFor="sort-criteria" className="block text-xs text-muted-foreground mb-1">Ordenar por:</Label>
              <Select value={sortCriteria} onValueChange={(value) => setSortCriteria(value as SortCriteria)}>
                <SelectTrigger id="sort-criteria" className="w-full md:w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isComparisonMode && teamB ? (
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 !bg-border">
                <TabsTrigger
                  value="teamA"
                  disabled={noPlayersTeamA && searchTerm.trim() === '' && eligibleTeamAPlayers.length === 0}
                  className="data-[state=active]:!bg-card data-[state=active]:!text-primary data-[state=inactive]:hover:text-primary"
                >
                  {teamA.name}
                </TabsTrigger>
                <TabsTrigger
                  value="teamB"
                  disabled={noPlayersTeamB && searchTerm.trim() === '' && eligibleTeamBPlayers.length === 0}
                  className="data-[state=active]:!bg-card data-[state=active]:!text-primary data-[state=inactive]:hover:text-primary"
                >
                  {teamB.name}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="teamA">
                <ScrollArea className="h-[230px] pt-1 px-0 pb-0">
                  {renderPlayerList(displayedTeamAPlayers, teamA.name)}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="teamB">
                <ScrollArea className="h-[230px] pt-1 px-0 pb-0">
                  {renderPlayerList(displayedTeamBPlayers, teamB.name)}
                </ScrollArea>
              </TabsContent>
            </Tabs>
        ) : (
            <ScrollArea className="h-[300px] pt-1 px-0 pb-0">
              {renderPlayerList(displayedTeamAPlayers, teamA.name)}
            </ScrollArea>
        )}

        <DialogFooter className="mt-3">
          {selectedPlayerForSlot && (
            <Button variant="destructive" onClick={handleRemovePlayer} className="mr-auto">
              <Trash2 className="mr-2 h-4 w-4" />
              Quitar a {selectedPlayerForSlot.name}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
