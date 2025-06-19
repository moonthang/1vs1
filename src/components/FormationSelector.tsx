
"use client";

import { useLineupStore } from '@/store/lineupStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function FormationSelector() {
  const formations = useLineupStore((state) => state.formations);
  const selectedFormationKey = useLineupStore((state) => state.selectedFormationKey);
  const setSelectedFormation = useLineupStore((state) => state.setSelectedFormation);
  const resetLineup = useLineupStore((state) => state.resetLineup);

  if (!formations || formations.length === 0) {
    return <p>No hay formaciones disponibles.</p>;
  }
  
  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow">
      <Label htmlFor="formation-select" className="text-sm font-medium text-foreground mb-2 block font-headline">Seleccionar Formación</Label>
      <div className="flex items-center space-x-2">
        <Select
          value={selectedFormationKey || ""}
          onValueChange={(value) => setSelectedFormation(value)}
        >
          <SelectTrigger id="formation-select" className="w-full md:w-[200px] bg-background border-primary text-primary focus:ring-accent">
            <SelectValue placeholder="Elige formación" />
          </SelectTrigger>
          <SelectContent className="bg-background border-primary">
            {formations.map((formation) => (
              <SelectItem key={formation.key} value={formation.key} className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                {formation.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={resetLineup} aria-label="Restablecer alineación" title="Restablecer Alineación">
          <RotateCcw className="mr-2 h-4 w-4" />
          Restablecer
        </Button>
      </div>
    </div>
  );
}
