
'use client';

import React, { useState, useEffect } from 'react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';
import Image from 'next/image';
import { countries, type Country } from '@/data/countries';

interface NationalitySelectorProps {
  value: Country | null;
  onChange: (value: SingleValue<Country>) => void;
  className?: string;
}

const formatOptionLabel = ({ label, flag }: Country) => (
  <div className="flex items-center gap-2">
    <Image src={flag} alt={label} width={20} height={15} className="border border-muted" />
    <span>{label}</span>
  </div>
);

export function NationalitySelector({ value, onChange, className }: NationalitySelectorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const instanceId = React.useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const customStyles: StylesConfig<Country, false> = {
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    control: (base) => ({
      ...base,
      minHeight: '40px',
    }),
    valueContainer: (base) => ({
        ...base,
        height: '40px',
        padding: '0 6px'
    }),
    input: (base) => ({
        ...base,
        margin: '0px',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={className}>
      <Select<Country>
        instanceId={instanceId}
        options={countries}
        value={value}
        onChange={onChange}
        placeholder="Busca un país..."
        formatOptionLabel={formatOptionLabel}
        isSearchable
        styles={customStyles}
        menuPortalTarget={document.body}
        classNamePrefix="react-select"
      />
    </div>
  );
}
