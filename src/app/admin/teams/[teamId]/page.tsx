
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { PlayerRosterStatus, Team, Player, Coach, TeamInfo } from '@/types';
import type { Country } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, Users, PlusCircle, Edit, Trash2, Loader2, Eraser, X, ArrowRightLeft, BarChart3, Cake, Globe, Baby, Save, LayoutGrid, List, Search, Star, Bookmark, RefreshCw } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, runTransaction } from 'firebase/firestore';
import { uploadImage, deleteImage, moveImage } from '@/actions/uploadActions';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';
import logo1vs1 from '@/assets/logo/1vs1.png';
import { NationalitySelector } from '@/components/NationalitySelector';
import { countryMap } from '@/data/countries';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { calculateAge, cn, normalizeText } from '@/lib/utils';
import type { UploadResponse } from '@/actions/uploadActions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const parsePlayerValue = (value: string | undefined): number | null => {
    if (!value || value.trim() === '') return null;
    
    const valueStr = value.trim().replace(',', '.');
    const num = parseFloat(valueStr);
    
    if (isNaN(num)) return null;

    if (valueStr.includes('.')) {
        return Math.round(num * 1000000);
    }
    
    return Math.round(num * 1000);
};


const formatValueForInput = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';

    if (value >= 1000000) {
        const millions = value / 1000000;
        return millions.toFixed(1).replace('.', ',');
    }
    
    if (value >= 1000) {
        return (value / 1000).toString();
    }
    
    return value.toString();
};

const getNextAvailablePlayerId = (teamId: string, players: Player[]): string => {
    const teamPrefix = teamId.replace('team', '');
    const existingIdNumbers = new Set(
        players
            .filter(p => p.id.startsWith(teamPrefix))
            .map(p => parseInt(p.id.replace(teamPrefix, ''), 10))
            .filter(n => !isNaN(n))
    );

    let nextIdNumber = 1;
    while (existingIdNumbers.has(nextIdNumber)) {
        nextIdNumber++;
    }
    return `${teamPrefix}${nextIdNumber.toString().padStart(2, '0')}`;
};

const EditCoachDialog = ({ isOpen, onClose, coach, teamId, onSave }: { isOpen: boolean, onClose: () => void, coach: Coach | undefined, teamId: string, onSave: (coach: Coach) => void }) => {
  const [name, setName] = useState(coach?.name || '');
  const [selectedNationality, setSelectedNationality] = useState<Country | null>(null);
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
      const initialNationality = coach.nationality ? countryMap.get(coach.nationality) || null : null;
      setSelectedNationality(initialNationality);
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
    let updatedCoach: Coach = { ...coach, name, nationality: selectedNationality?.value };

    try {
        if (imageAction === 'replace' && newFileData) {
            if (coach.imageFileId) {
                const deleteResult = await deleteImage(coach.imageFileId);
                if (!deleteResult.success) {
                    toast({ variant: 'destructive', title: 'Error de borrado', description: `No se pudo borrar la imagen anterior. ${deleteResult.error || ''}` });
                    setIsSaving(false);
                    return;
                }
            }
            const uploadResult = await uploadImage(newFileData, `${name.replace(/\s+/g, '_')}-coach.png`, `/${teamId}`);
            if (uploadResult.success && uploadResult.url && uploadResult.fileId) {
                updatedCoach.imageUrl = uploadResult.url;
                updatedCoach.imageFileId = uploadResult.fileId;
            } else {
                toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error || "No se pudo subir la imagen del DT." });
                setIsSaving(false);
                return;
            }
        } else if (imageAction === 'remove') {
            if (coach.imageFileId) {
                const deleteResult = await deleteImage(coach.imageFileId);
                if (!deleteResult.success) {
                    toast({ variant: 'destructive', title: 'Error de borrado', description: `No se pudo borrar la imagen. ${deleteResult.error || ''}` });
                    setIsSaving(false);
                    return;
                }
            }
            updatedCoach.imageUrl = '';
            updatedCoach.imageFileId = '';
        }
        
        onSave(updatedCoach);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error inesperado', description: 'Ocurrió un error al guardar.' });
    } finally {
        setIsSaving(false);
        onClose();
    }
  };
  
  const handleClose = () => {
    setImageAction('keep');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
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
              <Label htmlFor="coach-nationality" className="text-right">Nacionalidad</Label>
              <NationalitySelector 
                  value={selectedNationality}
                  onChange={setSelectedNationality}
                  className="col-span-3"
              />
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
  const [player, setPlayer] = useState<Partial<Player>>({ stats: {}, teamId, rosterStatus: 'in_roster' });
  const [valueInput, setValueInput] = useState('');
  const [selectedNationality, setSelectedNationality] = useState<Country | null>(null);
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setPlayer({ stats: {}, teamId, rosterStatus: 'in_roster' });
    setSelectedNationality(null);
    setNewFileData(null);
    setIsSaving(false);
    setValueInput('');
  };
  
  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2 && value.length <= 4) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length > 4) value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
    setPlayer(prev => ({ ...prev, birthDate: value.slice(0, 10) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    if (type === 'number') {
        let numValue: number | undefined = value === '' ? undefined : parseInt(value, 10);
        if (numValue !== undefined && numValue < 0) {
            numValue = 0;
        }
        if (isNaN(numValue as number)) {
            numValue = undefined;
        }
        setPlayer(prev => ({ ...prev, [id]: numValue }));
    } else {
        setPlayer(prev => ({ ...prev, [id]: value }));
    }
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
  
  const handleStatusChange = (value: PlayerRosterStatus) => {
      setPlayer(prev => ({ ...prev, rosterStatus: value }));
  };

  const handleSave = async () => {
    if (!player.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre del jugador es obligatorio.' });
      return;
    }
    
    setIsSaving(true);
    const newPlayerId = getNextAvailablePlayerId(teamId, players);
    
    let uploadResult: UploadResponse | null = null;
    if (newFileData) {
        uploadResult = await uploadImage(newFileData, `${newPlayerId}_${player.name.replace(/\s+/g, '_')}.png`, `/${teamId}`);
        if (!uploadResult.success) {
            toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error || "No se pudo subir la imagen del jugador." });
            setIsSaving(false);
            return;
        }
    }

    const finalPlayer: Player = {
        id: newPlayerId,
        name: player.name,
        jerseyNumber: player.jerseyNumber ?? 0,
        position: player.position || '',
        stats: player.stats || {},
        imageUrl: uploadResult?.url || '',
        imageFileId: uploadResult?.fileId || '',
        teamId: teamId,
        needsPhotoUpdate: !uploadResult?.url,
        nationality: selectedNationality?.value || '',
        birthDate: player.birthDate || '',
        value: parsePlayerValue(valueInput) ?? 0,
        rosterStatus: player.rosterStatus || 'in_roster',
    };

    onSave(finalPlayer);
    toast({ title: 'Éxito', description: 'Jugador agregado correctamente.' });
    handleClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[425px]"
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
            <Input id="jerseyNumber" type="number" min="0" value={player.jerseyNumber ?? ''} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nationality" className="text-right">Nacionalidad</Label>
            <NationalitySelector 
              value={selectedNationality}
              onChange={setSelectedNationality}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="birthDate" className="text-right">Fec. Nacimiento</Label>
            <Input id="birthDate" value={player.birthDate || ''} onChange={handleDateChange} className="col-span-3" placeholder="DD/MM/YYYY" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">Valor (€)</Label>
            <Input id="value" type="text" value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Ej: 1,5 (mill) o 400 (mil)" className="col-span-3" />
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
              <Label htmlFor="rosterStatus" className="text-right">Categoría</Label>
              <Select onValueChange={handleStatusChange} value={player.rosterStatus}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="in_roster">Plantilla Principal</SelectItem>
                      <SelectItem value="legend">Leyenda</SelectItem>
                  </SelectContent>
              </Select>
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
  const [valueInput, setValueInput] = useState('');
  const [selectedNationality, setSelectedNationality] = useState<Country | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageAction, setImageAction] = useState<'keep' | 'replace' | 'remove'>('keep');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && player) {
      setEditedPlayer(JSON.parse(JSON.stringify(player)));
      
      const initialNationality = player.nationality ? countryMap.get(player.nationality) || null : null;
      setSelectedNationality(initialNationality);
      
      setValueInput(formatValueForInput(player.value));

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedPlayer) return;
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2 && value.length <= 4) value = value.slice(0, 2) + '/' + value.slice(2);
    if (value.length > 4) value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
    setEditedPlayer(prev => prev ? { ...prev, birthDate: value.slice(0, 10) } : null);
  };

  const handleInputChange = (field: keyof Player, value: string | number | boolean | undefined | null) => {
    if (!editedPlayer) return;
    
    let processedValue = value;
    if (field === 'jerseyNumber' && typeof value === 'string') {
        let numValue = parseInt(value, 10);
        if (isNaN(numValue)) numValue = 0;
        if (numValue < 0) numValue = 0;
        processedValue = numValue;
    }

    setEditedPlayer(prev => prev ? { ...prev, [field]: processedValue } : null);
  };
  
  const handleStatChange = (statKey: keyof Player['stats'], value: string) => {
    if (!editedPlayer) return;
    const isFloat = statFields.find(f => f.key === statKey)?.type === 'float';
    
    if (value === '') {
        setEditedPlayer(prev => {
            if (!prev) return null;
            const newStats = { ...prev.stats };
            delete newStats[statKey];
            return { ...prev, stats: newStats };
        });
        return;
    }

    let numValue = isFloat ? parseFloat(value.replace(',', '.')) : parseInt(value, 10);

    if (isNaN(numValue)) {
        return; 
    }

    if (numValue < 0) {
        numValue = 0;
    }

    if (statKey === 'Sofascore' && numValue > 10) {
        numValue = 10;
    }

    setEditedPlayer(prev => {
        if (!prev) return null;
        const newStats = { ...prev.stats, [statKey]: numValue };
        return { ...prev, stats: newStats };
    });
  };
  
   const handleStatusChange = (value: PlayerRosterStatus) => {
      if (!editedPlayer) return;
      setEditedPlayer(prev => prev ? { ...prev, rosterStatus: value } : null);
  };

  const handleSave = async () => {
    if (!editedPlayer) return;
    setIsSaving(true);
    let finalPlayer = { ...editedPlayer, nationality: selectedNationality?.value || '', value: parsePlayerValue(valueInput) ?? undefined };
    
    try {
        if (imageAction === 'replace' && newFileData) {
            if (player?.imageFileId) {
                const deleteResult = await deleteImage(player.imageFileId);
                 if (!deleteResult.success) {
                    toast({ variant: 'destructive', title: 'Error de borrado', description: `No se pudo borrar la imagen anterior. ${deleteResult.error || ''}` });
                    setIsSaving(false);
                    return;
                }
            }
            const uploadResult = await uploadImage(newFileData, `${editedPlayer.id}_${editedPlayer.name.replace(/\s+/g, '_')}.png`, `/${editedPlayer.teamId}`);
            if (uploadResult.success && uploadResult.url && uploadResult.fileId) {
                finalPlayer.imageUrl = uploadResult.url;
                finalPlayer.imageFileId = uploadResult.fileId;
                finalPlayer.needsPhotoUpdate = false;
            } else {
                toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error || 'No se pudo subir la nueva imagen del jugador.' });
                setIsSaving(false);
                return;
            }
        } else if (imageAction === 'remove') {
            if (player?.imageFileId) {
                const deleteResult = await deleteImage(player.imageFileId);
                if (!deleteResult.success) {
                    toast({ variant: 'destructive', title: 'Error de borrado', description: `No se pudo borrar la imagen. ${deleteResult.error || ''}` });
                    setIsSaving(false);
                    return;
                }
            }
            finalPlayer.imageUrl = '';
            finalPlayer.imageFileId = '';
        }
        
        onSave(finalPlayer as Player);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error inesperado', description: 'Ocurrió un error al guardar.' });
    } finally {
        setIsSaving(false);
        onClose();
    }
  };

  const handleClose = () => {
    setIsSaving(false);
    setImageAction('keep');
    setValueInput('');
    onClose();
  }

  if (!editedPlayer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
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
            <Input 
                id="jerseyNumber" 
                type="number" 
                min="0"
                value={editedPlayer.jerseyNumber ?? ''} 
                onChange={(e) => handleInputChange('jerseyNumber', e.target.value)} 
                className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nationality" className="text-right">Nacionalidad</Label>
              <NationalitySelector 
                  value={selectedNationality}
                  onChange={setSelectedNationality}
                  className="col-span-3"
              />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="birthDate" className="text-right">Fec. Nacimiento</Label>
            <Input id="birthDate" value={editedPlayer.birthDate ?? ''} onChange={handleDateChange} className="col-span-3" placeholder="DD/MM/YYYY" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">Valor (€)</Label>
            <Input id="value" type="text" value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Ej: 1,5 (mill) o 400 (mil)" className="col-span-3" />
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
              <Label htmlFor="rosterStatus" className="text-right">Categoría</Label>
              <Select onValueChange={(val) => handleStatusChange(val as PlayerRosterStatus)} value={editedPlayer.rosterStatus}>
                  <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="in_roster">Plantilla Principal</SelectItem>
                      <SelectItem value="loaned">Prestado</SelectItem>
                      <SelectItem value="legend">Leyenda</SelectItem>
                  </SelectContent>
              </Select>
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
                        min="0"
                        {...(key === 'Sofascore' && { max: "10" })}
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


const MovePlayerDialog = ({ isOpen, onClose, player, teams, currentTeamId, onMove }: {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  teams: TeamInfo[];
  currentTeamId: string;
  onMove: (player: Player, newTeamId: string, keepPhoto: boolean, markAsLoaned: boolean) => Promise<void>;
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [keepPhoto, setKeepPhoto] = useState(true);
  const [markAsLoaned, setMarkAsLoaned] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedTeamId('');
      setIsMoving(false);
      setKeepPhoto(true);
      setMarkAsLoaned(false);
    }
  }, [isOpen]);

  const handleMove = async () => {
    if (!player || !selectedTeamId) return;
    setIsMoving(true);
    await onMove(player, selectedTeamId, keepPhoto, markAsLoaned);
    setIsMoving(false);
    onClose();
  };

  const availableTeams = teams.filter(t => t.id !== currentTeamId);

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover a {player.name}</DialogTitle>
          <DialogDescription>
            Selecciona el equipo de destino y las opciones de transferencia.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="destination-team" className="mb-2 block">Mover a:</Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger id="destination-team">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
                id="keep-photo" 
                checked={keepPhoto} 
                onCheckedChange={(checked) => setKeepPhoto(Boolean(checked))}
                disabled={!player.imageFileId}
            />
            <Label htmlFor="keep-photo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Conservar foto actual
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
                id="mark-as-loaned" 
                checked={markAsLoaned} 
                onCheckedChange={(checked) => setMarkAsLoaned(Boolean(checked))}
            />
            <Label htmlFor="mark-as-loaned" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              ¿Marcar como prestado?
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isMoving}>Cancelar</Button>
          <Button onClick={handleMove} disabled={!selectedTeamId || isMoving}>
            {isMoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
            Mover Jugador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const PlayerListSection = ({ title, icon, players, onPlayerClick, onEdit, onMove, onDelete, onEndLoan, selectedPlayer, viewMode }: {
    title: string;
    icon: React.ReactNode;
    players: Player[];
    onPlayerClick: (player: Player) => void;
    onEdit: (player: Player) => void;
    onMove?: (player: Player) => void;
    onDelete: (player: Player) => void;
    onEndLoan?: (player: Player) => void;
    selectedPlayer: Player | null;
    viewMode: 'card' | 'list';
}) => {
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline text-primary">
                    {icon}
                    {title} ({players.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {players.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay jugadores para mostrar en esta categoría.</p>
                ) : viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map(player => (
                            <PlayerCard
                                key={player.id}
                                player={player}
                                showStats={true}
                                onSelect={onPlayerClick}
                                isSelected={selectedPlayer?.id === player.id}
                                onEdit={() => onEdit(player)}
                                onMove={onMove ? () => onMove(player) : undefined}
                                onDelete={() => onDelete(player)}
                                onEndLoan={onEndLoan ? () => onEndLoan(player) : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-2 text-xs sm:px-4 sm:text-sm">Nombre</TableHead>
                                    <TableHead className="text-center px-1 text-xs sm:px-4 sm:text-sm">Dorsal</TableHead>
                                    <TableHead className="px-2 text-xs sm:px-4 sm:text-sm">Posición</TableHead>
                                    <TableHead className="text-right px-2 text-xs sm:px-4 sm:text-sm">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map(player => (
                                    <TableRow
                                        key={player.id}
                                        className={cn("cursor-pointer", selectedPlayer?.id === player.id && "bg-muted")}
                                        onClick={() => onPlayerClick(player)}
                                    >
                                        <TableCell className="font-medium px-2 text-xs sm:px-4 sm:text-sm">{player.name}</TableCell>
                                        <TableCell className="text-center px-1 text-xs sm:px-4 sm:text-sm">{player.jerseyNumber}</TableCell>
                                        <TableCell className="px-2 text-xs sm:px-4 sm:text-sm">{player.position}</TableCell>
                                        <TableCell className="text-right px-2 sm:px-4">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); onEdit(player); }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Editar</p></TooltipContent>
                                                </Tooltip>
                                                {onMove && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-sky-600 hover:text-sky-700" onClick={(e) => { e.stopPropagation(); onMove(player); }}>
                                                                <ArrowRightLeft className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Mover</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {onEndLoan && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                             <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 hover:text-green-700" onClick={(e) => { e.stopPropagation(); onEndLoan(player); }}>
                                                                <RefreshCw className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Finalizar Préstamo</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(player); }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Eliminar</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function TeamViewPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;
    const { toast } = useToast();
    const [team, setTeam] = useState<Team | null>(null);
    const [allTeams, setAllTeams] = useState<TeamInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditCoachModalOpen, setEditCoachModalOpen] = useState(false);
    const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
    const [isEditPlayerModalOpen, setEditPlayerModalOpen] = useState(false);
    const [isMovePlayerModalOpen, setMovePlayerModalOpen] = useState(false);
    const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
    const [playerToEndLoan, setPlayerToEndLoan] = useState<Player | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [isSearchActive, setIsSearchActive] = useState(false);
    
    const { rosterPlayers, loanedPlayers, legendPlayers } = useMemo(() => {
        if (!team?.players) return { rosterPlayers: [], loanedPlayers: [], legendPlayers: [] };
        
        const roster: Player[] = [];
        const loaned: Player[] = [];
        const legends: Player[] = [];

        team.players.forEach(p => {
            if (p.rosterStatus === 'loaned') loaned.push(p);
            else if (p.rosterStatus === 'legend') legends.push(p);
            else roster.push(p); // 'in_roster' or undefined
        });
        
        const positionOrder: (string | undefined)[] = ['Portero', 'Defensa', 'Mediocampista', 'Delantero', undefined];

        const sortFn = (a: Player, b: Player) => {
            const posAIndex = positionOrder.indexOf(a.position);
            const posBIndex = positionOrder.indexOf(b.position);
            if (posAIndex !== posBIndex) {
                return posAIndex - posBIndex;
            }
            return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
        };

        return {
            rosterPlayers: roster.sort(sortFn),
            loanedPlayers: loaned.sort(sortFn),
            legendPlayers: legends.sort(sortFn),
        };

    }, [team?.players]);

    const filteredRosterPlayers = useMemo(() => {
        let players = rosterPlayers;

        if (searchTerm) {
            const term = normalizeText(searchTerm);
            players = players.filter(p => 
                normalizeText(p.name).includes(term) || 
                p.jerseyNumber?.toString().includes(term)
            );
        }

        return players;
    }, [rosterPlayers, searchTerm]);
    
    const finalCoachImageUrl = useMemo(() => {
        if (!team?.coach?.imageUrl) return null;
        if (team.coach.imageUrl.startsWith('http') || team.coach.imageUrl.startsWith('data:')) {
            return team.coach.imageUrl;
        }
        return `${IMAGEKIT_URL_ENDPOINT}/${team.id}/${team.coach.imageUrl}`;
    }, [team]);

    const teamStats = useMemo(() => {
        if (!rosterPlayers) return null;

        const playersWithAge = rosterPlayers
            .map(p => ({ ...p, age: calculateAge(p.birthDate) }))
            .filter(p => p.age !== null);

        const totalAge = playersWithAge.reduce((sum, p) => sum + (p.age as number), 0);
        const averageAge = playersWithAge.length > 0 ? (totalAge / playersWithAge.length).toFixed(1) : 'N/A';

        const foreignPlayers = rosterPlayers.filter(p => p.nationality && p.nationality !== 'CO').length;
        
        const u20Players = playersWithAge.filter(p => (p.age as number) < 20).length;

        return {
            totalPlayers: rosterPlayers.length,
            averageAge,
            foreignPlayers,
            u20Players,
        };
    }, [rosterPlayers]);

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
            const teamsCollectionRef = collection(db, 'equipos');

            const [teamDoc, teamsSnapshot] = await Promise.all([
                getDoc(teamDocRef),
                getDocs(teamsCollectionRef)
            ]);
            
            const allTeamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamInfo));
            setAllTeams(allTeamsData);

            if (teamDoc.exists()) {
                const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;
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
        const playerToAdd = {
            ...newPlayer,
            imageFileId: newPlayer.imageFileId ?? '',
            nationality: newPlayer.nationality ?? '',
            birthDate: newPlayer.birthDate ?? '',
            value: newPlayer.value ?? 0,
            rosterStatus: newPlayer.rosterStatus || 'in_roster',
        };

        try {
            const teamRef = doc(db, "equipos", teamId);
            await updateDoc(teamRef, { players: arrayUnion(playerToAdd) });
            
            await fetchTeamData(); // Refetch to get sorted lists
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
            
            await fetchTeamData(); // Refetch to get sorted and filtered lists
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
                const deleteResult = await deleteImage(playerToDelete.imageFileId);
                if (!deleteResult.success) {
                    toast({
                        variant: 'destructive',
                        title: 'Error de borrado de imagen',
                        description: `No se pudo eliminar la imagen de ImageKit, pero el jugador será eliminado de la base de datos. ${deleteResult.error || ''}`
                    });
                }
            }
            const teamRef = doc(db, "equipos", teamId);
            const originalPlayerObject = team.players.find(p => p.id === playerToDelete.id);
            if (originalPlayerObject) {
              await updateDoc(teamRef, { players: arrayRemove(originalPlayerObject) });
            }
            
            await fetchTeamData(); // Refetch
            setPlayerToDelete(null);
            setSelectedPlayer(null);
            toast({ title: 'Éxito', description: 'Jugador eliminado correctamente.' });
        } catch (error) {
            console.error("Error deleting player: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el jugador.' });
        }
    };

    const handleMovePlayer = async (playerToMove: Player, newTeamId: string, keepPhoto: boolean, markAsLoaned: boolean) => {
        if (!team || !playerToMove || !newTeamId) return;
    
        const oldTeamRef = doc(db, "equipos", teamId);
        const newTeamRef = doc(db, "equipos", newTeamId);
    
        try {
            await runTransaction(db, async (transaction) => {
                const oldTeamDoc = await transaction.get(oldTeamRef);
                const newTeamDoc = await transaction.get(newTeamRef);
    
                if (!oldTeamDoc.exists() || !newTeamDoc.exists()) {
                    throw new Error("Uno de los equipos no existe.");
                }
    
                const oldTeamData = oldTeamDoc.data() as Team;
                const newTeamData = newTeamDoc.data() as Team;
    
                const playerInOldTeam = oldTeamData.players.find(p => p.id === playerToMove.id);
                if (!playerInOldTeam) {
                    throw new Error("El jugador no se encontró en el equipo original.");
                }
    
                let newImageFileId = playerInOldTeam.imageFileId;
                let newImageUrl = playerInOldTeam.imageUrl;
                let needsPhotoUpdate = playerInOldTeam.needsPhotoUpdate;
                const newPlayerId = getNextAvailablePlayerId(newTeamId, newTeamData.players || []);
    
                if (keepPhoto && playerInOldTeam.imageFileId) {
                    const newFileName = `${newPlayerId}_${playerInOldTeam.name.replace(/\s+/g, '_')}.png`;
                    const moveResult = await moveImage(playerInOldTeam.imageFileId, `/${newTeamId}`, newFileName);
                    if (moveResult.success && moveResult.url && moveResult.fileId) {
                        newImageFileId = moveResult.fileId;
                        newImageUrl = moveResult.url;
                        needsPhotoUpdate = false;
                    } else {
                        toast({ variant: 'destructive', title: 'Error al Mover Foto', description: `No se pudo mover la foto, el jugador será movido sin ella. ${moveResult.error || ''}` });
                        newImageFileId = ''; newImageUrl = ''; needsPhotoUpdate = true;
                    }
                } else if (!keepPhoto && playerInOldTeam.imageFileId) {
                    await deleteImage(playerInOldTeam.imageFileId);
                    newImageFileId = ''; newImageUrl = ''; needsPhotoUpdate = true;
                }
    
                const movedPlayer: Player = {
                    ...playerInOldTeam,
                    id: newPlayerId,
                    teamId: newTeamId,
                    rosterStatus: 'in_roster',
                    needsPhotoUpdate: needsPhotoUpdate ?? true,
                    imageUrl: newImageUrl || '',
                    imageFileId: newImageFileId || '',
                    nationality: playerInOldTeam.nationality || '',
                    birthDate: playerInOldTeam.birthDate || '',
                    value: playerInOldTeam.value || 0,
                    stats: playerInOldTeam.stats || {},
                };
    
                const updatedNewPlayers = [...(newTeamData.players || []), movedPlayer];
                transaction.update(newTeamRef, { players: updatedNewPlayers });
    
                if (markAsLoaned) {
                    const updatedOldPlayers = oldTeamData.players.map(p =>
                        p.id === playerToMove.id ? { ...p, rosterStatus: 'loaned' as PlayerRosterStatus } : p
                    );
                    transaction.update(oldTeamRef, { players: updatedOldPlayers });
                } else {
                    const updatedOldPlayers = oldTeamData.players.filter(p => p.id !== playerToMove.id);
                    transaction.update(oldTeamRef, { players: updatedOldPlayers });
                }
            });
    
            await fetchTeamData();
            setSelectedPlayer(null);
            toast({ title: 'Jugador Movido', description: `${playerToMove.name} ha sido transferido.` });
    
        } catch (error: any) {
            console.error("Error al mover jugador:", error);
            toast({ variant: "destructive", title: "Error en la transferencia", description: error.message || "No se pudo completar la transferencia del jugador." });
        }
    };
    
     const handleEndLoan = async () => {
        if (!playerToEndLoan || !team) return;
        try {
            const teamRef = doc(db, "equipos", teamId);
            const updatedPlayers = team.players.map(p =>
                p.id === playerToEndLoan.id ? { ...p, rosterStatus: 'in_roster' as PlayerRosterStatus } : p
            );
            await updateDoc(teamRef, { players: updatedPlayers });

            await fetchTeamData();
            setPlayerToEndLoan(null);
            setSelectedPlayer(null);
            toast({ title: 'Préstamo Finalizado', description: `${playerToEndLoan.name} ha vuelto a la plantilla principal.` });
        } catch (error) {
            console.error("Error ending loan:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo finalizar el préstamo del jugador." });
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
            
            await fetchTeamData();
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

    const { name, logoUrl, coach } = team;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-6xl">
                <header className="mb-8 flex w-full items-center justify-between">
                    <Button onClick={() => router.push('/admin')} variant="ghost">
                        <ArrowLeft />
                    </Button>
                    <div className="flex items-center justify-center gap-4">
                        <Image 
                            src={logoUrl || ''} 
                            alt={`${name} logo`} 
                            width={50} 
                            height={50}
                            className="rounded-sm object-contain"
                        />
                        <h1 className="text-4xl font-bold text-primary">{name}</h1>
                    </div>
                    <div className="w-10" />
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        {coach && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-xl font-headline text-primary">
                                        <User className="mr-3 h-6 w-6" />
                                        Director Técnico
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                   <div className="flex flex-col items-center text-center gap-2">
                                      {finalCoachImageUrl && (
                                        <Image
                                          key={finalCoachImageUrl}
                                          src={finalCoachImageUrl}
                                          alt={coach.name || 'Director Técnico'}
                                          width={80}
                                          height={80}
                                          className="rounded-full object-cover border-2 border-primary"
                                        />
                                      )}
                                      <div className="flex flex-col gap-1">
                                        <p className="text-lg font-semibold">{coach.name}</p>
                                        {coach.nationality && countryMap.get(coach.nationality) && (
                                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                                                <Image src={countryMap.get(coach.nationality)!.flag} alt={countryMap.get(coach.nationality)!.label} width={20} height={15} className="border border-muted" />
                                                <span>{countryMap.get(coach.nationality)!.label}</span>
                                            </div>
                                        )}
                                      </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="justify-center">
                                    <Button variant="outline" size="sm" onClick={() => setEditCoachModalOpen(true)}>
                                        <Edit className="mr-2 h-4 w-4"/>
                                        Editar DT
                                    </Button>
                                </CardFooter>
                            </Card>
                        )}
                        {teamStats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-xl font-headline text-primary">
                                        <BarChart3 className="mr-3 h-6 w-6" />
                                        Estadísticas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Jugadores Totales</span>
                                        </div>
                                        <span className="font-semibold text-primary">{teamStats.totalPlayers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Cake className="h-4 w-4" />
                                            <span>Edad Media</span>
                                        </div>
                                        <span className="font-semibold text-primary">{teamStats.averageAge} años</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Globe className="h-4 w-4" />
                                            <span>Extranjeros</span>
                                        </div>
                                        <span className="font-semibold text-primary">{teamStats.foreignPlayers}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Baby className="h-4 w-4" />
                                            <span>Sub-20</span>
                                        </div>
                                        <span className="font-semibold text-primary">{teamStats.u20Players}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-5">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <CardTitle className="flex items-center text-xl font-headline text-primary">
                                        <Users className="mr-3 h-6 w-6" />
                                        Jugadores ({rosterPlayers.length})
                                    </CardTitle>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <div className="flex items-center gap-1">
                                            {isSearchActive ? (
                                                <Input
                                                    type="search"
                                                    placeholder="Buscar..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onBlur={() => setIsSearchActive(false)}
                                                    autoFocus
                                                    className="h-9 w-[150px] lg:w-[180px] animate-in fade-in duration-300"
                                                />
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => setIsSearchActive(true)} className="h-9 w-9">
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                            <Button variant={viewMode === 'card' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('card')}>
                                                <LayoutGrid className="h-4 w-4" />
                                            </Button>
                                            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                                                <List className="h-4 w-4" />
                                            </Button>
                                        </div>
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
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {viewMode === 'card' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredRosterPlayers.map(player => (
                                            <PlayerCard 
                                            key={player.id} 
                                            player={player} 
                                            showStats={true}
                                            onSelect={handlePlayerClick}
                                            isSelected={selectedPlayer?.id === player.id}
                                            onEdit={() => { setSelectedPlayer(player); setEditPlayerModalOpen(true); }}
                                            onMove={() => { setSelectedPlayer(player); setMovePlayerModalOpen(true); }}
                                            onDelete={() => setPlayerToDelete(player)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="px-2 text-xs sm:px-4 sm:text-sm">Nombre</TableHead>
                                                    <TableHead className="text-center px-1 text-xs sm:px-4 sm:text-sm">Dorsal</TableHead>
                                                    <TableHead className="px-2 hidden sm:table-cell text-xs sm:px-4 sm:text-sm">Nacionalidad</TableHead>
                                                    <TableHead className="text-right px-2 text-xs sm:px-4 sm:text-sm">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredRosterPlayers.map(player => {
                                                    const country = player.nationality ? countryMap.get(player.nationality) : null;
                                                    return (
                                                    <TableRow 
                                                        key={player.id} 
                                                        className={cn("cursor-pointer", selectedPlayer?.id === player.id && "bg-muted")}
                                                        onClick={() => handlePlayerClick(player)}
                                                    >
                                                        <TableCell className="font-medium px-2 text-xs sm:px-4 sm:text-sm">{player.name}</TableCell>
                                                        <TableCell className="text-center px-1 text-xs sm:px-4 sm:text-sm">{player.jerseyNumber}</TableCell>
                                                        <TableCell className="px-2 hidden sm:table-cell">
                                                            {country && (
                                                                <div className="flex items-center gap-2">
                                                                    <Image src={country.flag} alt={country.label} width={20} height={15} className="border border-muted" />
                                                                    <span>{country.label}</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right px-2 sm:px-4">
                                                             <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setEditPlayerModalOpen(true); }}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Editar</p></TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                         <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-sky-600 hover:text-sky-700" onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setMovePlayerModalOpen(true); }}>
                                                                            <ArrowRightLeft className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Mover</p></TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setPlayerToDelete(player); }}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Eliminar</p></TooltipContent>
                                                                </Tooltip>
                                                             </TooltipProvider>
                                                        </TableCell>
                                                    </TableRow>
                                                )})}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                 {filteredRosterPlayers.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No hay jugadores para mostrar en la plantilla principal.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                         <PlayerListSection
                            title="Jugadores Prestados"
                            icon={<Bookmark className="mr-3 h-6 w-6 text-orange-500" />}
                            players={loanedPlayers}
                            onPlayerClick={handlePlayerClick}
                            onEdit={(player) => { setSelectedPlayer(player); setEditPlayerModalOpen(true); }}
                            onDelete={setPlayerToDelete}
                            onEndLoan={(player) => { setPlayerToEndLoan(player); }}
                            selectedPlayer={selectedPlayer}
                            viewMode={viewMode}
                        />

                        <PlayerListSection
                            title="Leyendas del Club"
                            icon={<Star className="mr-3 h-6 w-6 text-yellow-500" />}
                            players={legendPlayers}
                            onPlayerClick={handlePlayerClick}
                            onEdit={(player) => { setSelectedPlayer(player); setEditPlayerModalOpen(true); }}
                            onMove={(player) => { setSelectedPlayer(player); setMovePlayerModalOpen(true); }}
                            onDelete={setPlayerToDelete}
                            selectedPlayer={selectedPlayer}
                            viewMode={viewMode}
                        />
                    </div>
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
                    onClose={() => { setEditPlayerModalOpen(false); setSelectedPlayer(null); }}
                    player={selectedPlayer}
                    onSave={handleEditPlayer}
                />
            )}
            {selectedPlayer && (
                <MovePlayerDialog
                    isOpen={isMovePlayerModalOpen}
                    onClose={() => { setMovePlayerModalOpen(false); setSelectedPlayer(null); }}
                    player={selectedPlayer}
                    teams={allTeams}
                    currentTeamId={teamId}
                    onMove={handleMovePlayer}
                />
            )}
            <AlertDialog open={!!playerToDelete} onOpenChange={(isOpen) => !isOpen && setPlayerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará a {playerToDelete?.name} permanentemente del equipo y su imagen de ImageKit.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePlayer}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!playerToEndLoan} onOpenChange={(isOpen) => !isOpen && setPlayerToEndLoan(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Finalizar Préstamo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas finalizar el préstamo de {playerToEndLoan?.name}? Volverá a la plantilla principal de este equipo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEndLoan}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ScrollToTopButton />
        </div>
    );
}
