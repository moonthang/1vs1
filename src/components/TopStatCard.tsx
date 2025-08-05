
"use client";

import type { Player, Team } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';

interface TopStatCardProps {
  player: Player | null;
  team: Team | null;
  statValue: number | string | undefined;
  icon: React.ReactNode;
  title: string;
  className?: string;
}

const getPlayerImageUrl = (player: Player | null) => {
  if (!player || !player.imageUrl) return `https://placehold.co/64x64.png`;
  if (player.imageUrl.startsWith('http') || player.imageUrl.startsWith('data:')) return player.imageUrl;
  return `${IMAGEKIT_URL_ENDPOINT}/${player.teamId}/${player.imageUrl}`;
};

const getSofascoreBadgeClass = (score: number) => {
  if (score < 6.0) return 'bg-red-500 text-white';
  if (score < 6.5) return 'bg-orange-500 text-white';
  if (score < 7.0) return 'bg-yellow-500 text-white';
  if (score < 8.0) return 'bg-green-500 text-white';
  if (score <= 10.0) return 'bg-teal-500 text-white';
  return 'bg-gray-400 text-white';
};

export function TopStatCard({ player, team, statValue, icon, title, className }: TopStatCardProps) {
  if (!player || statValue === undefined || statValue === null) {
    return null;
  }

  const playerImage = getPlayerImageUrl(player);
  const teamLogo = team?.logoUrl;
  
  const isSofascore = title === "Mejor Rating";

  const renderStatValue = () => {
    if (isSofascore && typeof statValue === 'number') {
      const badgeClass = getSofascoreBadgeClass(statValue);
      return (
        <span className={`px-2 py-0.5 rounded-md text-sm font-bold ${badgeClass}`}>
          {statValue.toFixed(2)}
        </span>
      );
    }
    return (
      <p className="font-bold text-lg text-primary mt-1">{statValue}</p>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center text-sm font-headline text-primary">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Image
            src={playerImage}
            alt={player.name}
            width={56}
            height={56}
            className="rounded-full object-cover border-2"
            style={{ borderColor: team?.primaryColor || '#ccc' }}
          />
          {teamLogo && (
            <Image
              src={teamLogo}
              alt={`${team?.name || ''} logo`}
              width={24}
              height={24}
              className="absolute -bottom-1 -right-1 rounded-full border bg-card p-0.5"
            />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <p className="font-semibold text-sm leading-tight truncate">{player.name}</p>
          <p className="text-muted-foreground text-xs truncate">{team?.name}</p>
          <div className="mt-1">
            {renderStatValue()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
