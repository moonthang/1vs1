
"use client";

import type { Player } from '@/types';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Target, ShieldCheck, Zap, ArrowRightLeft, Dumbbell, ListChecks, Goal, Handshake, Star, RefreshCw, Cake, Euro } from 'lucide-react';
import { useState, useEffect } from 'react';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';
import { Badge } from '@/components/ui/badge';
import { countryMap } from '@/data/countries';

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  isSelected?: boolean;
  showStats?: boolean;
  isUnavailable?: boolean;
}

function calculateAge(birthDateString?: string): number | null {
  if (!birthDateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(birthDateString)) {
    return null;
  }
  const parts = birthDateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const birthDate = new Date(year, month, day);
  const today = new Date();
  if (isNaN(birthDate.getTime())) return null;
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const StatIcon = ({ statName }: { statName: string }) => {
  const lowerStatName = statName.toLowerCase();
  switch (lowerStatName) {
    case 'pace': return <Zap className="w-4 h-4 mr-1 text-blue-500" />;
    case 'shooting': return <Target className="w-4 h-4 mr-1 text-red-500" />;
    case 'passing': return <ArrowRightLeft className="w-4 h-4 mr-1 text-green-500" />;
    case 'dribbling': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-yellow-500 lucide lucide-footprints"><path d="M4 16v-2.38c0-.9.69-1.78 1.58-1.95A2.4 2.4 0 0 1 8 13.12V16"/><path d="M4.68 12.52a2.4 2.4 0 0 1 0-4.39A2.4 2.4 0 0 1 7.3 6.88V10"/><path d="M5.32 4.68a2.4 2.4 0 0 1 4.39 0A2.4 2.4 0 0 1 11.12 7.3V10"/><path d="M17.32 12.52a2.4 2.4 0 0 1 0-4.39A2.4 2.4 0 0 1 20.03 6.9V10"/><path d="M18 16v-2.38c0-.9.69-1.78 1.58-1.95A2.4 2.4 0 0 1 22 13.12V16"/><path d="M18.68 4.68a2.4 2.4 0 0 1 4.39 0A2.4 2.4 0 0 1 21.32 7.3V10"/></svg>;
    case 'defending': return <ShieldCheck className="w-4 h-4 mr-1 text-indigo-500" />;
    case 'physicality': return <Dumbbell className="w-4 h-4 mr-1 text-purple-500" />;
    case 'partidos': return <ListChecks className="w-4 h-4 mr-1 text-gray-500" />;
    case 'goles': return <Goal className="w-4 h-4 mr-1 text-green-500" />;
    case 'asistencia': return <Handshake className="w-4 h-4 mr-1 text-teal-500" />;
    case 'sofascore': return <Star className="w-4 h-4 mr-1 text-amber-500" />;
    case 'arcos en cero': return <ShieldCheck className="w-4 h-4 mr-1 text-gray-500" />;
    case 'goles recibidos': return <Goal className="w-4 h-4 mr-1 text-red-600" />;
    default: return <User className="w-4 h-4 mr-1 text-gray-500" />;
  }
};

const preferredStatsOrder: (keyof Player['stats'])[] = ['Partidos', 'Goles', 'Asistencia', 'Arcos en cero', 'Goles recibidos', 'Sofascore'];

const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toString().replace('.', ',')} mill.`;
  }
  if (value >= 1000) {
    return `${Math.round(value / 1000)} mil`;
  }
  return value.toLocaleString('de-DE');
};

export function PlayerCard({ player, onSelect, isSelected, showStats = false, isUnavailable = false }: PlayerCardProps) {
  
  const getImageUrl = () => {
    let imageUrl = player.imageUrl || '';
    
    if (!imageUrl) {
        return `https://placehold.co/${showStats ? '120x120' : '48x48'}.png?text=${player.name.charAt(0) || 'P'}`;
    }

    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        return `${IMAGEKIT_URL_ENDPOINT}/${player.teamId}/${imageUrl}`;
    }
    
    return imageUrl;
  };

  const calculatedImageUrl = getImageUrl();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [calculatedImageUrl]);

  const finalSrc = hasError 
    ? `https://placehold.co/${showStats ? '120x120' : '48x48'}.png?text=Err` 
    : calculatedImageUrl;
    
  const country = player.nationality ? countryMap.get(player.nationality) : null;
  const age = calculateAge(player.birthDate);
  
  return (
    <Card
      className={`relative transition-all duration-200 ease-in-out hover:shadow-lg
        ${isSelected ? 'ring-2 ring-accent' : ''}
        ${isUnavailable ? 'opacity-60 bg-muted cursor-not-allowed' : (onSelect ? 'cursor-pointer' : '')}
      `}
      onClick={isUnavailable || !onSelect ? undefined : () => onSelect(player)}
      aria-selected={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable || !onSelect ? -1 : 0}
      onKeyDown={isUnavailable || !onSelect ? undefined : (e) => (e.key === 'Enter' || e.key === ' ') && onSelect(player)}
    >
      {showStats ? (
        <div className="grid grid-cols-10 gap-x-2 p-2 items-start">
          <div className="col-span-3 flex-shrink-0 relative">
            <Image
              key={finalSrc}
              src={finalSrc}
              alt={player.name}
              width={120} 
              height={120}
              className="rounded-md object-cover aspect-[3/4] border border-muted"
              onError={() => setHasError(true)}
            />
             {player.needsPhotoUpdate && (
                <div className="absolute bottom-1 right-1 left-1 z-10">
                    <Badge variant="destructive" className="w-full justify-center text-[10px] px-1 py-0.5 animate-pulse leading-tight">
                        <RefreshCw className="w-2.5 h-2.5 mr-1" />
                        Actualizar Foto
                    </Badge>
                </div>
            )}
          </div>

          <div className="col-span-3 flex flex-col justify-start">
            <CardTitle className="text-sm font-headline leading-tight mb-1">{player.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {player.position === 'DT' ? player.position : `#${player.jerseyNumber} - ${player.position}`}
            </p>
            {country && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Image src={country.flag} alt={country.label} width={16} height={12} className="border border-muted" />
                    <span>{country.label}</span>
                </div>
            )}
            {age !== null && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Cake className="w-3.5 h-3.5" />
                  <span>{age} años</span>
              </div>
            )}
            {player.value != null && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Euro className="w-3.5 h-3.5" />
                  <span>{formatValue(player.value)}</span>
              </div>
            )}
          </div>

          {showStats && (
            <div className="col-span-4">
              <div className="space-y-0.5 text-xs">
                {preferredStatsOrder.map((statName) => {
                  const isGoalkeeper = player.position === 'Portero';
                  const goalkeeperStats: (keyof Player['stats'])[] = ['Arcos en cero', 'Goles recibidos'];

                  if (!isGoalkeeper && goalkeeperStats.includes(statName)) {
                    return null;
                  }

                  const statValue = player.stats?.[statName];
                  
                  return (
                    <div key={statName} className="flex items-center">
                      <StatIcon statName={statName as string} />
                      <span className="capitalize truncate">{statName}:</span>
                      <span className="ml-auto font-semibold">
                        {statValue ?? '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <CardHeader className="p-4">
          <div className="flex items-center space-x-3">
            <Image
              key={finalSrc}
              src={finalSrc}
              alt={player.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={() => setHasError(true)}
            />
            <div className="flex flex-col">
              <CardTitle className="text-base font-headline">{player.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {player.position === 'DT' ? player.position : `#${player.jerseyNumber} - ${player.position}`}
              </p>
              {country && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Image src={country.flag} alt={country.label} width={16} height={12} className="border border-muted" />
                      <span>{country.label}</span>
                  </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
    </Card>
  );
}
