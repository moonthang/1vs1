
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Eye, Edit, Trash2, Loader2, UploadCloud, Download, X } from 'lucide-react';
import type { TeamInfo } from '@/types';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadImage, deleteImage } from '@/actions/uploadActions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const EditTeamDialog = ({
  team,
  isOpen,
  onClose,
  onSave,
}: {
  team: TeamInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (teamId: string, data: Partial<TeamInfo>) => void;
}) => {
  const [name, setName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newFileData, setNewFileData] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#1A237E');
  const [secondaryColor, setSecondaryColor] = useState('#4FC3F7');
  const [isSaving, setIsSaving] = useState(false);
  const [imageAction, setImageAction] = useState<'keep' | 'replace' | 'remove'>('keep');
  const { toast } = useToast();

  useEffect(() => {
    if (team && isOpen) {
      setName(team.name);
      setPrimaryColor(team.primaryColor || '#1A237E');
      setSecondaryColor(team.secondaryColor || '#4FC3F7');
      setPreviewUrl(team.logoUrl);
      setNewFileData(null);
      setIsSaving(false);
      setImageAction('keep');
    }
  }, [team, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setNewFileData(reader.result as string);
        setImageAction('replace');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!team || !name) return;
    setIsSaving(true);
    let updatedData: Partial<TeamInfo> = { name, primaryColor, secondaryColor };

    if (imageAction === 'replace' && newFileData) {
        if (team.logoFileId) {
            await deleteImage(team.logoFileId);
        }
        const uploadResult = await uploadImage(newFileData, `${team.id}-logo.png`, `/${team.id}`);
        if (uploadResult.success && uploadResult.url && uploadResult.fileId) {
            updatedData.logoUrl = uploadResult.url;
            updatedData.logoFileId = uploadResult.fileId;
        } else {
            toast({ variant: 'destructive', title: 'Error de Subida', description: uploadResult.error });
            setIsSaving(false);
            return;
        }
    } else if (imageAction === 'remove') {
        if (team.logoFileId) {
            await deleteImage(team.logoFileId);
        }
        updatedData.logoUrl = '';
        updatedData.logoFileId = '';
    }
    
    onSave(team.id, updatedData);
    setIsSaving(false);
    onClose();
  };

  const handleClose = () => {
    setImageAction('keep');
    onClose();
  };

  if (!team) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {team.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="team-name" className="text-right">Nombre</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="team-logo" className="text-right">Logo</Label>
            <div className="col-span-3">
              {previewUrl ? (
                  <div className="relative w-fit">
                      <Image 
                          src={previewUrl} 
                          alt="Team Logo Preview" 
                          width={100} 
                          height={100} 
                          className="rounded-md object-contain border p-1"
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
                  <Input id="team-logo" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="primary-color-text" className="text-right">Color Primario</Label>
            <div className="col-span-3 flex items-center gap-2">
                <Input
                    id="primary-color-picker"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="p-1 h-10 w-12 cursor-pointer"
                />
                <Input
                    id="primary-color-text"
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full"
                    placeholder="#1A237E"
                />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="secondary-color-text" className="text-right">Color Secundario</Label>
             <div className="col-span-3 flex items-center gap-2">
                <Input
                    id="secondary-color-picker"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="p-1 h-10 w-12 cursor-pointer"
                />
                <Input
                    id="secondary-color-text"
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full"
                    placeholder="#4FC3F7"
                />
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

const AddTeamDialog = ({ isOpen, onClose, onSave, teams }: { isOpen: boolean; onClose: () => void; onSave: (team: TeamInfo) => void; teams: TeamInfo[] }) => {
    const [name, setName] = useState('');
    const [newFileData, setNewFileData] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState('#1A237E');
    const [secondaryColor, setSecondaryColor] = useState('#4FC3F7');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const getNextAvailableTeamId = () => {
        const existingIds = new Set(teams.map(t => t.id.replace('team', '')));
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of alphabet) {
            if (!existingIds.has(letter)) {
                return `team${letter}`;
            }
        }
        return `team${Date.now()}`;
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

    const handleSave = async () => {
        if (!name || !newFileData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un nombre y selecciona un logo.' });
            return;
        }
        setIsSaving(true);
        const teamId = getNextAvailableTeamId();
        
        const uploadResult = await uploadImage(newFileData, `${teamId}-logo.png`, `/${teamId}`);

        if (!uploadResult.success || !uploadResult.url || !uploadResult.fileId) {
            toast({ variant: 'destructive', title: 'Error de subida', description: uploadResult.error });
            setIsSaving(false);
            return;
        }

        const newTeam: TeamInfo = {
            id: teamId,
            name: name,
            logoUrl: uploadResult.url,
            logoFileId: uploadResult.fileId,
            primaryColor,
            secondaryColor,
        };

        onSave(newTeam);
        toast({ title: 'Éxito', description: 'Equipo agregado correctamente.' });
        handleClose();
    };

    const handleClose = () => {
        setName('');
        setNewFileData(null);
        setPrimaryColor('#1A237E');
        setSecondaryColor('#4FC3F7');
        setIsSaving(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Equipo</DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del nuevo equipo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {newFileData && (
                        <div className="flex justify-center mb-4">
                            <Image src={newFileData} alt="Team Logo Preview" width={100} height={100} className="rounded-md object-contain border p-1"  />
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-team-name" className="text-right">Nombre</Label>
                        <Input
                            id="new-team-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-team-logo" className="text-right">Logo</Label>
                        <div className="col-span-3">
                            <Input id="new-team-logo" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/svg+xml" />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="add-primary-color-text" className="text-right">Color Primario</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="add-primary-color-picker"
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="p-1 h-10 w-12 cursor-pointer"
                            />
                            <Input
                                id="add-primary-color-text"
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-full"
                                placeholder="#1A237E"
                            />
                       </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="add-secondary-color-text" className="text-right">Color Secundario</Label>
                       <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="add-secondary-color-picker"
                                type="color"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="p-1 h-10 w-12 cursor-pointer"
                            />
                            <Input
                                id="add-secondary-color-text"
                                type="text"
                                value={secondaryColor}
                                onChange={(e) => setSecondaryColor(e.target.value)}
                                className="w-full"
                                placeholder="#4FC3F7"
                            />
                       </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSaving ? 'Guardando...' : 'Agregar Equipo'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function AdminPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<TeamInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [teamToEdit, setTeamToEdit] = useState<TeamInfo | null>(null);
    const [teamToDelete, setTeamToDelete] = useState<TeamInfo | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importData, setImportData] = useState<{ teams: any[] } | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
                setIsAuthorized(true);
                fetchTeams();
            } else {
                router.replace('/');
            }
        }
    }, [router]);

    const fetchTeams = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'equipos'));
            const teamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamInfo[];
            setTeams(teamsData);
        } catch (error) {
            console.error("Error fetching teams: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los equipos." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewTeam = (teamId: string) => {
        router.push(`/admin/teams/${teamId}`);
    };

    const handleOpenEditModal = (team: TeamInfo) => {
        setTeamToEdit(team);
        setEditModalOpen(true);
    };

    const handleSaveTeam = async (teamId: string, dataToUpdate: Partial<TeamInfo>) => {
        try {
            const teamRef = doc(db, 'equipos', teamId);
            await updateDoc(teamRef, dataToUpdate);

            setTeams(currentTeams =>
                currentTeams.map(t =>
                    t.id === teamId ? { ...t, ...dataToUpdate } as TeamInfo : t
                )
            );
            toast({ title: 'Equipo Actualizado', description: 'Los cambios se han guardado en la base de datos.' });
        } catch (error) {
            console.error("Error updating team: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el equipo." });
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;
        try {
            if (teamToDelete.logoFileId) {
                await deleteImage(teamToDelete.logoFileId);
            }
            await deleteDoc(doc(db, 'equipos', teamToDelete.id));
            setTeams(currentTeams => currentTeams.filter(t => t.id !== teamToDelete.id));
            toast({ title: 'Equipo Eliminado', description: `${teamToDelete.name} ha sido eliminado de la base de datos.` });
        } catch (error) {
            console.error("Error deleting team: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el equipo." });
        } finally {
            setTeamToDelete(null);
        }
    };

    const handleAddTeam = async (newTeam: TeamInfo) => {
        try {
            const { id, ...newTeamData } = newTeam;
            await setDoc(doc(db, 'equipos', id), {
                ...newTeamData,
                coach: { name: "Sin Asignar", imageUrl: "" },
                players: []
            });
            setTeams(currentTeams => [...currentTeams, newTeam]);
        } catch (error) {
            console.error("Error adding team: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el equipo." });
        }
    };

    const handleExport = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'equipos'));
            const teamsData = querySnapshot.docs.map(teamDoc => ({ id: teamDoc.id, ...teamDoc.data() }));

            const backupData = {
                version: '1.0',
                createdAt: new Date().toISOString(),
                data: {
                    teams: teamsData,
                }
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lineup-showdown-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({ title: 'Exportación Completa', description: 'Los datos se han guardado localmente.' });
        } catch (error) {
            console.error("Error exporting data: ", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron exportar los datos." });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') throw new Error("No se pudo leer el archivo");
                const parsedData = JSON.parse(result);

                if (parsedData && parsedData.data && Array.isArray(parsedData.data.teams)) {
                    setImportData(parsedData.data);
                } else {
                    throw new Error("El archivo JSON no tiene el formato esperado.");
                }
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error de Importación", description: error.message || "El archivo no es un JSON válido." });
                setImportData(null);
            } finally {
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const processImport = async () => {
        if (!importData) return;
        setIsImporting(true);
        try {
            const writePromises = importData.teams.map(team => {
                const { id, ...teamData } = team;
                if (!id) return Promise.resolve();
                const teamRef = doc(db, 'equipos', id);
                return setDoc(teamRef, teamData);
            });

            await Promise.all(writePromises);
            
            toast({ title: 'Importación Exitosa', description: 'Los datos de los equipos se han restaurado desde el archivo.' });
            await fetchTeams();
        } catch (error) {
            console.error("Error importing data: ", error);
            toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al importar los datos." });
        } finally {
            setIsImporting(false);
            setImportData(null);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <span>Verificando acceso...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-6xl">
                <header className="mb-8 flex flex-col items-center gap-4">
                    <div className="relative flex w-full items-center justify-center">
                        <Button variant="ghost" size="icon" className="absolute left-0" onClick={() => router.push('/')}>
                            <ArrowLeft />
                        </Button>
                        <h1 className="text-3xl font-bold text-primary text-center sm:text-4xl px-12">
                            Panel de Administración
                        </h1>
                    </div>
                    <div className="flex w-full justify-center gap-2 flex-wrap">
                        <Button onClick={() => setAddModalOpen(true)}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Agregar Equipo
                        </Button>
                        <Button variant="outline" onClick={handleImportClick}>
                            <UploadCloud className="mr-2 h-5 w-5" />
                            Importar
                        </Button>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-5 w-5" />
                            Exportar
                        </Button>
                    </div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                           <Card key={i}>
                               <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                               <CardContent><Skeleton className="h-4 w-full" /></CardContent>
                               <CardFooter className="flex justify-between gap-2">
                                   <Skeleton className="h-10 w-1/3" />
                                   <Skeleton className="h-10 w-1/3" />
                                   <Skeleton className="h-10 w-1/3" />
                               </CardFooter>
                           </Card>
                        ))
                    ) : teams.length === 0 ? (
                        <Card className="md:col-span-2 lg:col-span-3 text-center p-8">
                           <CardTitle>No hay equipos en la base de datos.</CardTitle>
                           <CardContent className="mt-4">
                               <p>Parece que tu base de datos está vacía.</p>
                               <p className="font-semibold">Haz clic en "Agregar Equipo" para empezar a construir tu liga.</p>
                           </CardContent>
                        </Card>
                    ) : (
                        teams.map((team) => (
                            <Card key={team.id} className="flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                                    <div className="w-4 h-12 rounded-full" style={{ backgroundColor: team.primaryColor || '#ccc' }}></div>
                                    <Image 
                                        src={team.logoUrl} 
                                        alt={`${team.name} logo`} 
                                        width={48} 
                                        height={48}
                                        className="rounded-sm object-contain"
                                        key={team.logoUrl}
                                    />
                                    <CardTitle>{team.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">ID del equipo: {team.id}</p>
                                </CardContent>
                                <CardFooter className="flex flex-row justify-end gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-center group flex items-center w-10 hover:w-24 h-10 transition-all duration-300 overflow-hidden"
                                                    onClick={() => handleViewTeam(team.id)}
                                                >
                                                    <Eye className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
                                                    <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-hover:ml-2 transition-all duration-300 overflow-hidden whitespace-nowrap">
                                                        Ver
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Ver Equipo</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="justify-center group flex items-center w-10 hover:w-28 h-10 transition-all duration-300 overflow-hidden"
                                                    onClick={() => handleOpenEditModal(team)}
                                                >
                                                    <Edit className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
                                                    <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-hover:ml-2 transition-all duration-300 overflow-hidden whitespace-nowrap">
                                                        Editar
                                                    </span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Editar Equipo</p>
                                            </TooltipContent>
                                        </Tooltip>

                                        <AlertDialog onOpenChange={(isOpen) => !isOpen && setTeamToDelete(null)}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            className="justify-center group flex items-center w-10 hover:w-32 h-10 transition-all duration-300 overflow-hidden"
                                                            onClick={() => setTeamToDelete(team)}
                                                        >
                                                            <Trash2 className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
                                                            <span className="opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-hover:ml-2 transition-all duration-300 overflow-hidden whitespace-nowrap">
                                                                Eliminar
                                                            </span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Eliminar Equipo</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción eliminará a {team.name} permanentemente de la base de datos y sus imágenes asociadas. Esta acción es irreversible.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDeleteTeam}>
                                                        Confirmar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TooltipProvider>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </main>
            </div>
            
            <EditTeamDialog 
                team={teamToEdit}
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleSaveTeam}
            />

            <AddTeamDialog
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSave={handleAddTeam}
                teams={teams}
            />

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/json"
                onChange={handleFileSelected}
            />
            <AlertDialog open={!!importData} onOpenChange={(isOpen) => !isOpen && setImportData(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Importación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de sobrescribir los datos de los equipos existentes con el contenido de este archivo. Esta acción no se puede deshacer. ¿Deseas continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isImporting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={processImport} disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    
