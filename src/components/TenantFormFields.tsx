import React from 'react';
import type { TenantInfo } from '../services/adminApi';

// Países con su zona horaria habitual
export const COUNTRY_OPTIONS: { country: string; timezone: string }[] = [
  { country: 'El Salvador', timezone: 'America/El_Salvador' },
  { country: 'Guatemala', timezone: 'America/Guatemala' },
  { country: 'Honduras', timezone: 'America/Tegucigalpa' },
  { country: 'Nicaragua', timezone: 'America/Managua' },
  { country: 'Costa Rica', timezone: 'America/Costa_Rica' },
  { country: 'Panamá', timezone: 'America/Panama' },
  { country: 'Belice', timezone: 'America/Belize' },
  { country: 'México', timezone: 'America/Mexico_City' },
  { country: 'Colombia', timezone: 'America/Bogota' },
  { country: 'Ecuador', timezone: 'America/Guayaquil' },
  { country: 'Perú', timezone: 'America/Lima' },
];

export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'America/El_Salvador', label: 'El Salvador (UTC-6)' },
  { value: 'America/Guatemala', label: 'Guatemala (UTC-6)' },
  { value: 'America/Tegucigalpa', label: 'Honduras (UTC-6)' },
  { value: 'America/Managua', label: 'Nicaragua (UTC-6)' },
  { value: 'America/Costa_Rica', label: 'Costa Rica (UTC-6)' },
  { value: 'America/Belize', label: 'Belice (UTC-6)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/Panama', label: 'Panamá (UTC-5)' },
  { value: 'America/Bogota', label: 'Colombia (UTC-5)' },
  { value: 'America/Guayaquil', label: 'Ecuador (UTC-5)' },
  { value: 'America/Lima', label: 'Perú (UTC-5)' },
];

export type TenantFormValues = {
  address: string;
  city: string;
  phone: string;
  email: string;
  whatsapp: string;
  country: string;
  timezone: string;
};

export const EMPTY_TENANT_FORM: TenantFormValues = {
  address: '',
  city: '',
  phone: '',
  email: '',
  whatsapp: '',
  country: 'El Salvador',
  timezone: 'America/El_Salvador',
};

export const tenantToForm = (t: TenantInfo): TenantFormValues => ({
  address: t.address || '',
  city: t.city || '',
  phone: t.phone || '',
  email: t.email || '',
  whatsapp: t.whatsapp || '',
  country: t.country || EMPTY_TENANT_FORM.country,
  timezone: t.timezone || EMPTY_TENANT_FORM.timezone,
});

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';
const INPUT = 'w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500';

interface TenantFormFieldsProps {
  idPrefix: string;
  values: TenantFormValues;
  onChange: (values: TenantFormValues) => void;
}

// Campos compartidos de la residencial (Configuración y "Nueva residencial")
export const TenantFormFields: React.FC<TenantFormFieldsProps> = ({ idPrefix, values, onChange }) => {
  const set = (patch: Partial<TenantFormValues>) => onChange({ ...values, ...patch });
  const countries = COUNTRY_OPTIONS.some((c) => c.country === values.country)
    ? COUNTRY_OPTIONS
    : [...COUNTRY_OPTIONS, { country: values.country, timezone: values.timezone }];
  const timezones = TIMEZONE_OPTIONS.some((z) => z.value === values.timezone)
    ? TIMEZONE_OPTIONS
    : [...TIMEZONE_OPTIONS, { value: values.timezone, label: values.timezone }];

  const handleCountry = (country: string) => {
    const found = COUNTRY_OPTIONS.find((c) => c.country === country);
    set(found ? { country, timezone: found.timezone } : { country });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address`} className={LABEL}>Dirección</label>
        <input id={`${idPrefix}-address`} type="text" value={values.address}
          onChange={(e) => set({ address: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-city`} className={LABEL}>Ciudad</label>
        <input id={`${idPrefix}-city`} type="text" value={values.city}
          onChange={(e) => set({ city: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-country`} className={LABEL}>País</label>
        <select id={`${idPrefix}-country`} value={values.country}
          onChange={(e) => handleCountry(e.target.value)} className={INPUT}>
          {countries.map((c) => (
            <option key={c.country} value={c.country}>{c.country}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-timezone`} className={LABEL}>Zona horaria</label>
        <select id={`${idPrefix}-timezone`} value={values.timezone}
          onChange={(e) => set({ timezone: e.target.value })} className={INPUT}>
          {timezones.map((z) => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-phone`} className={LABEL}>Teléfono</label>
        <input id={`${idPrefix}-phone`} type="tel" value={values.phone}
          onChange={(e) => set({ phone: e.target.value })} className={INPUT} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-whatsapp`} className={LABEL}>WhatsApp</label>
        <input id={`${idPrefix}-whatsapp`} type="tel" value={values.whatsapp}
          onChange={(e) => set({ whatsapp: e.target.value })} className={INPUT} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-email`} className={LABEL}>Correo de contacto</label>
        <input id={`${idPrefix}-email`} type="email" value={values.email}
          onChange={(e) => set({ email: e.target.value })} className={INPUT} />
      </div>
    </div>
  );
};

export default TenantFormFields;
