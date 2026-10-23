import React, { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { adminApi } from '../services/adminApi';

const blockLabel = (b: string) => b.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
export const houseLabel = (h: any) => `${h.block ? `${blockLabel(h.block)} - ` : ''}Casa ${h.unitNumber}`;

interface HouseComboboxProps {
  houses: any[];
  value: string;
  onChange: (houseId: string, house?: any) => void;
  id?: string;
  placeholder?: string;
  // Permite crear una vivienda (prefijo + número) desde el selector
  allowCreate?: boolean;
  onCreated?: (house: any) => void;
}

// Selector de vivienda con búsqueda por número, bloque o residente
export const HouseCombobox: React.FC<HouseComboboxProps> = ({
  houses,
  value,
  onChange,
  id,
  placeholder = 'Buscar por número, bloque o residente...',
  allowCreate,
  onCreated,
}) => {
  const toast = useToast();
  const [houseSearch, setHouseSearch] = useState('');
  const [houseListOpen, setHouseListOpen] = useState(false);
  const [houseActiveIndex, setHouseActiveIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [newPrefixId, setNewPrefixId] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!allowCreate) return;
    adminApi
      .getHousePrefixes()
      .then((res) => {
        if (res.success) setPrefixes((res.prefixes || []).filter((p: any) => p.isActive));
      })
      .catch((err) => console.warn('Error loading prefixes:', err));
  }, [allowCreate]);

  const selectedHouse = houses.find((h) => h.id === value);
  const filteredHouses = houses.filter((h) => {
    const q = houseSearch.trim().toLowerCase();
    if (!q) return true;
    const residents = (h.residents || []).map((r: any) => r.fullName || '').join(' ');
    return `${houseLabel(h)} ${residents}`.toLowerCase().includes(q);
  });
  const selectHouse = (h: any) => {
    onChange(h.id, h);
    setHouseSearch('');
    setHouseListOpen(false);
  };

  const handleCreate = async () => {
    if (!newNumber.trim()) {
      toast.error('El número de vivienda es obligatorio.');
      return;
    }
    if (prefixes.length > 0 && !newPrefixId) {
      toast.error('Selecciona un prefijo.');
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.createHouse(
        prefixes.length > 0 ? { prefixId: newPrefixId, number: newNumber.trim() } : { unitNumber: newNumber.trim() },
      );
      if (res.success && res.house) {
        onCreated?.(res.house);
        onChange(res.house.id, res.house);
        setCreating(false);
        setNewNumber('');
        toast.success('Vivienda creada.');
      } else {
        toast.error(res.message || 'No se pudo crear la vivienda.');
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo crear la vivienda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <input id={id}
        type="text"
        role="combobox"
        aria-expanded={houseListOpen}
        aria-autocomplete="list"
        aria-controls="quick-entry-house-listbox"
        aria-activedescendant={
          houseListOpen && filteredHouses[houseActiveIndex]
            ? `quick-entry-house-${filteredHouses[houseActiveIndex].id}`
            : undefined
        }
        value={houseListOpen ? houseSearch : selectedHouse ? houseLabel(selectedHouse) : ''}
        placeholder={placeholder}
        onFocus={() => {
          setHouseSearch('');
          setHouseActiveIndex(0);
          setHouseListOpen(true);
        }}
        onBlur={() => setHouseListOpen(false)}
        onChange={(e) => {
          setHouseSearch(e.target.value);
          setHouseActiveIndex(0);
          setHouseListOpen(true);
          if (value) onChange('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHouseListOpen(true);
            setHouseActiveIndex((i) => Math.min(i + 1, filteredHouses.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHouseActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && houseListOpen) {
            e.preventDefault();
            if (filteredHouses[houseActiveIndex]) selectHouse(filteredHouses[houseActiveIndex]);
          } else if (e.key === 'Escape' && houseListOpen) {
            e.stopPropagation();
            setHouseListOpen(false);
          }
        }}
        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      />
      {houseListOpen && (
        <ul
          id="quick-entry-house-listbox"
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-lg"
        >
          {filteredHouses.length === 0 ? (
            <li className="px-3 py-2 text-slate-400">No se encontraron viviendas.</li>
          ) : (
            filteredHouses.map((h, i) => (
              <li
                key={h.id}
                id={`quick-entry-house-${h.id}`}
                ref={(el) => {
                  if (el && i === houseActiveIndex) el.scrollIntoView({ block: 'nearest' });
                }}
                role="option"
                aria-selected={h.id === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectHouse(h);
                }}
                onMouseEnter={() => setHouseActiveIndex(i)}
                className={`px-3 py-2 cursor-pointer text-white ${
                  i === houseActiveIndex ? 'bg-blue-600/30' : ''
                }`}
              >
                {houseLabel(h)}
                {h.residents?.length > 0 && (
                  <span className="text-slate-400"> · {h.residents[0].fullName}</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
      {allowCreate && (
        <div className="mt-2">
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Crear vivienda nueva
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {prefixes.length > 0 && (
                <select
                  aria-label="Prefijo de la vivienda"
                  value={newPrefixId}
                  onChange={(e) => setNewPrefixId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">Prefijo</option>
                  {prefixes.map((p) => (
                    <option key={p.id} value={p.id}>{p.code}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                aria-label="Número de la vivienda"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Número"
                className="w-28 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                disabled={saving}
                onClick={handleCreate}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold"
              >
                {saving ? 'Creando...' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
