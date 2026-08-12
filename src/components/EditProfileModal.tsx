import React, { useState } from 'react';
import { User, Mail, Lock, Camera, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface EditProfileModalProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  token: string;
  onClose: () => void;
  onProfileUpdated: (updatedUser: any) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  currentUser,
  token,
  onClose,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  );
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle local image file upload (convert to Base64 data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setFeedback({ type: 'error', text: 'La imagen no debe superar los 3 MB.' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('https://zentary-backend-production.up.railway.app/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          avatarUrl,
          password: newPassword.trim() !== '' ? newPassword : undefined,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        setFeedback({ type: 'success', text: '¡Perfil guardado correctamente en PostgreSQL!' });
        onProfileUpdated(data.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: data.message || 'Error al actualizar el perfil en la base de datos.' });
      }
    } catch (err: any) {
      setIsLoading(false);
      setFeedback({ type: 'error', text: 'Error de conexión con el servidor en Railway.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            Editar Perfil de Administrador
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Avatar Admin"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/40 shadow-xl"
              />
              <label
                htmlFor="avatar-file-input"
                className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold gap-1"
              >
                <Camera className="w-5 h-5 text-blue-400" />
                <span>Cambiar</span>
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Haz clic en la imagen para subir una foto desde tu computadora o pega un enlace abajo.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              URL Foto de Perfil (Opcional)
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Nueva Contraseña (Opcional)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Dejar en blanco para no cambiar"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Guardando en PostgreSQL...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
