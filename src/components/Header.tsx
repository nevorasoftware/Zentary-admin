import React, { useState } from 'react';
import { Search, Bell, Building2, Edit3, Check } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  communityName?: string;
  onUpdateCommunityName?: (newName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  communityName = 'Residencial Zentary',
  onUpdateCommunityName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(communityName);

  const handleSaveName = () => {
    if (tempName.trim() && onUpdateCommunityName) {
      onUpdateCommunityName(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-20 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {title}
          </h2>

          {/* Editable Community Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:text-emerald-400"
                  title="Guardar nombre"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>{communityName}</span>
                <button
                  onClick={() => {
                    setTempName(communityName);
                    setIsEditingName(true);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Cambiar nombre del condominio/residencial"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar residentes, visitas, guías..."
            className="w-full bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <button className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
        </button>

        <div className="h-8 w-px bg-slate-800" />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Railway Production API</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
