
"use client"

import * as React from "react"
import Image from "next/image"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { countries } from "@/data/countries"

interface NationalitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const countryMap = new Map(countries.map(c => [c.code, c]));

export function NationalitySelector({ value, onChange, className }: NationalitySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const selectedCountry = countryMap.get(value.toUpperCase());

  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (countryName: string) => {
    const selected = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    if (selected) {
      onChange(selected.code);
    }
    setOpen(false);
  }

  const filteredCountries = search.trim() === ''
    ? []
    : countries.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCountry ? (
              <Image 
                  src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                  alt={`${selectedCountry.name} flag`}
                  width={20}
                  height={15}
                  className="border border-muted"
              />
            ) : null}
            {selectedCountry
              ? selectedCountry.name
              : "Seleccionar país..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 nationality-selector-popover" align="start">
        <Command filter={() => 1}>
          <CommandInput
            placeholder="Buscar país..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim() === '' ? 'Escribe para buscar un país.' : 'No se encontró el país.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={handleSelect}
                  className="aria-selected:bg-primary aria-selected:text-primary-foreground"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toUpperCase() === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                   <Image 
                      src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                      alt={`${country.name} flag`}
                      width={20}
                      height={15}
                      className="mr-2 border border-muted"
                  />
                  {country.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
