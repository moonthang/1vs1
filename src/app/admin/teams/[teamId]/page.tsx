
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Team, Player, Coach } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, Users, PlusCircle, Edit, Trash2, Loader2, Eraser, Bot, X } from 'lucide-react';
import { PlayerCard } from '@/components/PlayerCard';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { uploadImage, deleteImage } from '@/actions/uploadActions';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';
import logo1vs1 from '@/assets/logo/1vs1.png';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NationalitySelector } from '@/components/NationalitySelector';

const EditCoachDialog = ({ isOpen, onClose, coach, teamId, onSave }: { isOpen: boolean, onClose: () => void, coach: Coach | undefined, teamId: string, onSave: (coach: Coach) => void }) => {
  const [name, setName] = useState(coach?.name || '');
  const [nationality, setNationality] = useState(coach?.nationality || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageAction, setImageAction] = useState<'keep' | 'replace' | 'remove'>('keep');
  const { toast } = useToast();

  const getCoachImageUrl = (coachData?: Coach, teamId?: string) => {
    if (!coachData?.imageUrl || !teamId) return null;
    if (coachData.imageUrl.startsWith('http') || coachData.imageUrl.startsWith('data:')) {
        return coachData.imageUrl;
    }
    return `${IMAGEKIT_URL_ENDPOINT}/${teamId}/${coachData.imageUrl}`;
  };

  useEffect(() => {
    if (isOpen && coach) {
      setName(coach.name);
      setNationality(coach.nationality || '');
      setPreviewUrl(getCoachImageUrl(coach, teamId));
      setNewFileData(null);
      setIsSaving(false);
      setImageAction('keep');
    }
  }, [coach, isOpen, teamId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        setNewFileData(dataUrl);
        setImageAction('replace');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    if (!coach || !teamId) return;
    setIsSaving(true);
    let updatedCoach: Coach = { ...coach, name, nationality };

    if (imageAction === 'replace' && newFileData) {
        if (coach.imageFileId) {
            await deleteImage(coach.imageFileId);
        }
        const uploadResult = await uploadImage(newFileData, `${name.replace(/\s+/g, '_')}-coach.png`, `/${teamId}`);
        if (uploadResult.success && uploadResult.url && uploadResult.fileId) {
            updatedCoach.imageUrl = uploadResult.url;
            updatedCoach.imageFileId = uploadResult.fileId;
        } else {
            toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error });
            setIsSaving(false);
            return;
        }
    } else if (imageAction === 'remove') {
        if (coach.imageFileId) {
            await deleteImage(coach.imageFileId);
        }
        updatedCoach.imageUrl = '';
        updatedCoach.imageFileId = '';
    }
    
    onSave(updatedCoach);
    onClose();
  };
  
  const handleClose = () => {
    setImageAction('keep');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest('.nationality-selector-popover')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar Director Técnico</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coach-name" className="text-right">
              Nombre
            </Label>
            <Input
              id="coach-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coach-nationality" className="text-right">
              Nacionalidad
            </Label>
            <div className="col-span-3"><NationalitySelector value={nationality} onChange={setNationality} /></div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="coach-image" className="text-right">
              Imagen
            </Label>
            <div className="col-span-3">
              {previewUrl ? (
                  <div className="relative w-fit">
                      <Image src={previewUrl} alt="Coach preview" width={80} height={80} className="rounded-md object-cover" />
                      <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => {
                              setPreviewUrl(null);
                              setImageAction('remove');
                          }}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                  </div>
              ) : (
                  <Input id="coach-image" type="file" onChange={handleFileChange} accept="image/*" />
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const playerPositions = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];

const AddPlayerDialog = ({ isOpen, onClose, onSave, teamId, players }: { isOpen: boolean, onClose: () => void, onSave: (player: Player) => void, teamId: string, players: Player[] }) => {
  const [player, setPlayer] = useState<Partial<Player>>({ stats: {}, teamId });
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setPlayer({ stats: {}, teamId, nationality: '' });
    setNewFileData(null);
    setIsSaving(false);
  };
  
  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setPlayer(prev => ({ ...prev, [id]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleNationalityChange = (code: string) => {
    setPlayer(prev => ({ ...prev, nationality: code }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePositionChange = (value: string) => {
    setPlayer(prev => ({ ...prev, position: value }));
  };

  const handleSave = async () => {
    if (!player.name || !player.jerseyNumber || !player.position || !newFileData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa todos los campos y selecciona una imagen.' });
      return;
    }
    
    setIsSaving(true);
    const teamPrefix = teamId.replace('team', '');
    const maxIdNumber = (players || [])
        .filter(p => p.id.startsWith(teamPrefix))
        .map(p => parseInt(p.id.replace(teamPrefix, ''), 10))
        .filter(n => !isNaN(n))
        .reduce((max, current) => (current > max ? current : max), 0);
    const newPlayerId = `${teamPrefix}${maxIdNumber + 1}`;
    
    const uploadResult = await uploadImage(newFileData, `${newPlayerId}_${player.name.replace(/\s+/g, '_')}.png`, `/${teamId}`);
    if (!uploadResult.success || !uploadResult.url || !uploadResult.fileId) {
        toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error });
        setIsSaving(false);
        return;
    }

    const finalPlayer: Player = {
        ...(player as Omit<Player, 'id' | 'imageUrl' | 'imageFileId'>),
        id: newPlayerId,
        imageUrl: uploadResult.url,
        imageFileId: uploadResult.fileId,
        teamId: teamId
    };
    onSave(finalPlayer);
    toast({ title: 'Éxito', description: 'Jugador agregado correctamente.' });
    handleClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest('.nationality-selector-popover')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Jugador</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" value={player.name || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jerseyNumber" className="text-right">Dorsal</Label>
            <Input id="jerseyNumber" type="number" value={player.jerseyNumber || ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">Posición</Label>
            <Select onValueChange={handlePositionChange} value={player.position}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una posición" />
                </SelectTrigger>
                <SelectContent>
                    {playerPositions.map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nationality" className="text-right">Nacionalidad</Label>
            <div className="col-span-3"><NationalitySelector value={player.nationality || ''} onChange={handleNationalityChange} /></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageUrl" className="text-right">Imagen</Label>
            <div className="col-span-3">
                <Input id="imageUrl" type="file" onChange={handleFileChange} accept="image/*" className="text-xs file:mr-2 file:text-xs" />
                 {newFileData && (
                  <div className="mt-2">
                    <Image src={newFileData} alt="Player preview" width={80} height={106} className="rounded-md object-cover"  />
                  </div>
                 )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Guardando...' : 'Guardar Jugador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const statFields: { key: keyof Player['stats']; label: string; type: 'number' | 'float' }[] = [
    { key: 'Partidos', label: 'Partidos', type: 'number' },
    { key: 'Goles', label: 'Goles', type: 'number' },
    { key: 'Asistencia', label: 'Asistencias', type: 'number' },
    { key: 'Sofascore', label: 'Sofascore', type: 'float' },
    { key: 'Arcos en cero', label: 'Arcos en Cero', type: 'number' },
    { key: 'Goles recibidos', label: 'Goles Recibidos', type: 'number' },
];

const EditPlayerDialog = ({
  isOpen,
  onClose,
  player,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSave: (player: Player) => void;
}) => {
  const [editedPlayer, setEditedPlayer] = useState<Player | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageAction, setImageAction] = useState<'keep' | 'replace' | 'remove'>('keep');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && player) {
      setEditedPlayer(JSON.parse(JSON.stringify(player)));
      
      let initialImageUrl = player.imageUrl || '';
      if (initialImageUrl && !initialImageUrl.startsWith('http') && !initialImageUrl.startsWith('data:')) {
        initialImageUrl = `${IMAGEKIT_URL_ENDPOINT}/${player.teamId}/${player.imageUrl}`;
      }
      setPreviewUrl(initialImageUrl);

      setNewFileData(null);
      setIsSaving(false);
      setImageAction('keep');
    }
  }, [player, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setNewFileData(result);
        setImageAction('replace');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof Player, value: string | number) => {
    if (!editedPlayer) return;
    setEditedPlayer(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleStatChange = (statKey: keyof Player['stats'], value: string) => {
    if (!editedPlayer) return;
    const isFloat = statFields.find(f => f.key === statKey)?.type === 'float';
    const numValue = value === '' ? undefined : (isFloat ? parseFloat(value) : parseInt(value, 10));

    setEditedPlayer(prev => {
        if (!prev) return null;
        const newStats = { ...prev.stats, [statKey]: numValue };
        return { ...prev, stats: newStats };
    });
  };

  const handleSave = async () => {
    if (!editedPlayer) return;
    setIsSaving(true);
    let finalPlayer = { ...editedPlayer };

    if (imageAction === 'replace' && newFileData) {
        if (player?.imageFileId) {
            await deleteImage(player.imageFileId);
        }
        const uploadResult = await uploadImage(newFileData, `${editedPlayer.id}_${editedPlayer.name.replace(/\s+/g, '_')}.png`, `/${editedPlayer.teamId}`);
        if (uploadResult.success && uploadResult.url && uploadResult.fileId) {
            finalPlayer.imageUrl = uploadResult.url;
            finalPlayer.imageFileId = uploadResult.fileId;
        } else {
            toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error });
            setIsSaving(false);
            return;
        }
    } else if (imageAction === 'remove') {
        if (player?.imageFileId) {
            await deleteImage(player.imageFileId);
        }
        finalPlayer.imageUrl = '';
        finalPlayer.imageFileId = '';
    }
    
    onSave(finalPlayer);
    onClose();
  };

  const handleClose = () => {
    setIsSaving(false);
    setImageAction('keep');
    onClose();
  }

  if (!editedPlayer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement).closest('.nationality-selector-popover')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar Jugador</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nombre</Label>
            <Input id="name" value={editedPlayer.name} onChange={(e) => handleInputChange('name', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jerseyNumber" className="text-right">Dorsal</Label>
            <Input id="jerseyNumber" type="number" value={editedPlayer.jerseyNumber} onChange={(e) => handleInputChange('jerseyNumber', Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">Posición</Label>
            <Select onValueChange={(val) => handleInputChange('position', val)} value={editedPlayer.position}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una posición" />
                </SelectTrigger>
                <SelectContent>
                    {playerPositions.map(pos => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nationality" className="text-right">Nacionalidad</Label>
             <div className="col-span-3"><NationalitySelector value={editedPlayer.nationality || ''} onChange={(code) => handleInputChange('nationality', code)} /></div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="player-image" className="text-right">Foto</Label>
            <div className="col-span-3">
                {previewUrl ? (
                    <div className="relative w-fit">
                        <Image
                            src={previewUrl}
                            alt={editedPlayer.name}
                            width={80}
                            height={106}
                            className="rounded-md object-cover border"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => {
                                setPreviewUrl(null);
                                setImageAction('remove');
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <Input 
                        id="player-image"
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                )}
            </div>
          </div>
          
          <Separator className="my-2" />
          <h4 className="text-sm font-medium text-center col-span-full">Estadísticas</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statFields.map(({ key, label, type }) => (
                 <div key={key} className="grid grid-cols-2 items-center gap-2">
                    <Label htmlFor={key} className="text-right text-xs">
                    {label}
                    </Label>
                    <Input
                    id={key}
                    type="number"
                    step={type === 'float' ? '0.01' : '1'}
                    value={editedPlayer.stats?.[key] ?? ''}
                    onChange={(e) => handleStatChange(key, e.target.value)}
                    className="h-8"
                    />
                </div>
            ))}
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
          <Button type="submit" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function TeamViewPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;
    const { toast } = useToast();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditCoachModalOpen, setEditCoachModalOpen] = useState(false);
    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [isEditPlayerModalOpen, setEditPlayerModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedPosition, setSelectedPosition] = useState('all');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    
    const positionOptions = ['all', ...playerPositions];

    const filteredPlayers = useMemo(() => {
        if (!team) return [];
        if (selectedPosition === 'all') return team.players;
        return team.players.filter(p => p.position === selectedPosition);
    }, [team, selectedPosition]);
    
    const finalCoachImageUrl = useMemo(() => {
        if (!team?.coach?.imageUrl) return null;
        if (team.coach.imageUrl.startsWith('http') || team.coach.imageUrl.startsWith('data:')) {
            return team.coach.imageUrl;
        }
        return `${IMAGEKIT_URL_ENDPOINT}/${team.id}/${team.coach.imageUrl}`;
    }, [team]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setIsAuthorized(true);
            } else {
                router.replace('/');
            }
            setIsLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);


    const fetchTeamData = async () => {
        if (!teamId) return;
        setLoading(true);
        try {
            const teamDocRef = doc(db, 'equipos', teamId);
            const teamDoc = await getDoc(teamDocRef);

            if (teamDoc.exists()) {
                const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
                let needsUpdate = false;
                
                const updatedPlayers = teamData.players.map(p => {
                    if (!p.nationality) {
                        needsUpdate = true;
                        return { ...p, nationality: 'CO' };
                    }
                    return p;
                });

                if (teamData.coach && !teamData.coach.nationality) {
                    teamData.coach.nationality = 'CO';
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await updateDoc(teamDocRef, {
                        players: updatedPlayers,
                        coach: teamData.coach,
                    });
                    teamData.players = updatedPlayers;
                    if(teamData.coach) teamData.coach.nationality = 'CO';
                    
                    toast({
                        title: 'Datos Migrados',
                        description: `Se asignó la nacionalidad Colombiana a los miembros de ${teamData.name}.`,
                    });
                }
                
                setTeam(teamData);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No se encontró el equipo.' });
            }
        } catch (error) {
            console.error("Error fetching team data: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el equipo.' });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (isAuthorized) {
            fetchTeamData();
        }
    }, [teamId, isAuthorized]);

    const handleSaveCoach = async (updatedCoach: Coach) => {
        if (!team) return;
        try {
            const teamRef = doc(db, "equipos", teamId);
            await updateDoc(teamRef, { coach: updatedCoach });
            setTeam(prevTeam => prevTeam ? { ...prevTeam, coach: updatedCoach } : null);
            toast({ title: 'Éxito', description: 'Director Técnico actualizado.' });
        } catch (error) {
            console.error("Error updating coach: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el DT.' });
        }
    };
    
    const handleAddPlayer = async (newPlayer: Player) => {
        if (!team) return;
        try {
            const teamRef = doc(db, "equipos", teamId);
            await updateDoc(teamRef, { players: arrayUnion(newPlayer) });
            setTeam(prevTeam => prevTeam ? { ...prevTeam, players: [...prevTeam.players, newPlayer] } : null);
        } catch (error) {
            console.error("Error adding player: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar el jugador.' });
        }
    };

    const handleEditPlayer = async (updatedPlayer: Player) => {
        if (!team) return;
        try {
            const teamRef = doc(db, "equipos", teamId);
            const updatedPlayers = team.players.map(p =>
                p.id === updatedPlayer.id ? updatedPlayer : p
            );
            await updateDoc(teamRef, { players: updatedPlayers });

            setTeam(prevTeam => prevTeam ? { ...prevTeam, players: updatedPlayers } : null);
            setSelectedPlayer(null);
            toast({ title: 'Éxito', description: 'Jugador actualizado correctamente.' });
        } catch (error) {
            console.error("Error updating player: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el jugador.' });
        }
    };

    const handleDeletePlayer = async () => {
        if (!playerToDelete || !team) return;
        try {
            if (playerToDelete.imageFileId) {
                await deleteImage(playerToDelete.imageFileId);
            }
            const teamRef = doc(db, "equipos", teamId);
            const originalPlayerObject = team.players.find(p => p.id === playerToDelete.id);
            if (originalPlayerObject) {
              await updateDoc(teamRef, { players: arrayRemove(originalPlayerObject) });
            }
            
            setTeam(prevTeam => prevTeam ? { ...prevTeam, players: prevTeam.players.filter(p => p.id !== playerToDelete.id) } : null);
            setPlayerToDelete(null);
            setSelectedPlayer(null);
            toast({ title: 'Éxito', description: 'Jugador eliminado correctamente.' });
        } catch (error) {
            console.error("Error deleting player: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el jugador.' });
        }
    };
    
    const handleClearAllPlayerStats = async () => {
        if (!team) return;

        const updatedPlayers = team.players.map(player => ({
            ...player,
            stats: {} 
        }));

        try {
            const teamRef = doc(db, "equipos", teamId);
            await updateDoc(teamRef, { players: updatedPlayers });

            setTeam(prevTeam => prevTeam ? { ...prevTeam, players: updatedPlayers } : null);
            toast({ title: 'Estadísticas Limpiadas', description: `Se han restablecido las estadísticas de todos los jugadores de ${team.name}.` });
        } catch (error) {
            console.error("Error clearing player stats: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron limpiar las estadísticas de los jugadores.' });
        }
    };

    const handlePlayerClick = (player: Player) => {
        setSelectedPlayer(prev => (prev?.id === player.id ? null : player));
    };

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Verificando acceso...</span>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    if (loading) {
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
            <p className="text-lg">Cargando datos del equipo...</p>
          </div>
        );
    }

    if (!team) {
        return <div className="min-h-screen flex items-center justify-center">No se pudo encontrar el equipo.</div>;
    }

    const { name, logoUrl, coach, players } = team;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-6xl">
                <header className="relative mb-8 flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2" onClick={() => router.push('/admin')}>
                        <ArrowLeft />
                    </Button>
                    <div className="flex flex-1 items-center justify-center gap-4">
                        <Image 
                            src={logoUrl || ''} 
                            alt={`${name} logo`} 
                            width={50} 
                            height={50}
                            className="rounded-sm object-contain"
                        />
                        <h1 className="text-4xl font-bold text-primary">{name}</h1>
                    </div>
                </header>

                <main>
                    {coach && (
                        <Card className="mb-8">
                            <CardHeader>
                                <CardTitle className="flex items-center text-xl font-headline text-primary">
                                    <User className="mr-3 h-6 w-6" />
                                    Director Técnico
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                               <div className="flex items-center gap-4">
                                  {finalCoachImageUrl && (
                                    <Image
                                      key={finalCoachImageUrl}
                                      src={finalCoachImageUrl}
                                      alt={coach.name || 'Director Técnico'}
                                      width={64}
                                      height={64}
                                      className="rounded-full object-cover border-2 border-primary"
                                    />
                                  )}
                                  <div>
                                    <p className="text-lg">{coach.name}</p>
                                    {coach.nationality && (
                                        <Image 
                                            src={`https://flagcdn.com/w20/${coach.nationality.toLowerCase()}.png`}
                                            alt={`${coach.nationality} flag`}
                                            width={20}
                                            height={15}
                                            className="border border-muted mt-1"
                                        />
                                    )}
                                  </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" onClick={() => setEditCoachModalOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Editar DT
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <CardTitle className="flex items-center text-xl font-headline text-primary">
                                    <Users className="mr-3 h-6 w-6" />
                                    Jugadores ({players.length})
                                </CardTitle>
                                <div className="flex w-full md:w-auto items-center gap-2 flex-wrap justify-end">
                                     <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                                        <SelectTrigger className="flex-1 md:w-[180px]">
                                            <SelectValue placeholder="Filtrar por posición" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {positionOptions.map(pos => (
                                                <SelectItem key={pos} value={pos}>
                                                    {pos === 'all' ? 'Todas las posiciones' : pos}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="secondary" size="sm">
                                                <Eraser className="mr-2 h-4 w-4" />
                                                Limpiar Stats
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción restablecerá las estadísticas de <strong>TODOS</strong> los jugadores de {team.name}. Esta acción es irreversible.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleClearAllPlayerStats}>
                                                    Sí, limpiar todo
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button variant="outline" size="sm" onClick={() => setAddPlayerModalOpen(true)}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Agregar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (selectedPlayer) {
                                                setEditPlayerModalOpen(true);
                                            }
                                        }}
                                        disabled={!selectedPlayer}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" size="sm" disabled={!selectedPlayer} onClick={() => setPlayerToDelete(selectedPlayer)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción eliminará a {selectedPlayer?.name} permanentemente del equipo y su imagen de ImageKit.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel onClick={() => setPlayerToDelete(null)}>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeletePlayer}>
                                                    Confirmar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPlayers.map(player => (
                                    <PlayerCard 
                                      key={player.id} 
                                      player={player} 
                                      showStats={true}
                                      onSelect={handlePlayerClick}
                                      isSelected={selectedPlayer?.id === player.id}
                                    />
                                ))}
                            </div>
                             {filteredPlayers.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No hay jugadores para mostrar en esta categoría.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
            {team && <EditCoachDialog 
                isOpen={isEditCoachModalOpen}
                onClose={() => setEditCoachModalOpen(false)}
                coach={coach}
                teamId={team.id}
                onSave={handleSaveCoach}
            />}
            <AddPlayerDialog
                isOpen={isAddPlayerModalOpen}
                onClose={() => setAddPlayerModalOpen(false)}
                onSave={handleAddPlayer}
                teamId={teamId}
                players={team.players}
            />
            {selectedPlayer && (
                <EditPlayerDialog
                    isOpen={isEditPlayerModalOpen}
                    onClose={() => setEditPlayerModalOpen(false)}
                    player={selectedPlayer}
                    onSave={handleEditPlayer}
                />
            )}
        </div>
    );
}
