import React, { useState, useEffect } from 'react';
import Sidebar, { AdminViewType } from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import AccessManagementView from './views/AccessManagementView';
import AnnouncementsView from './views/AnnouncementsView';
import VisitsLogView from './views/VisitsLogView';
import ParcelsView from './views/ParcelsView';
import PqrsSupportView from './views/PqrsSupportView';
import PaymentsView from './views/PaymentsView';
import AmenitiesView from './views/AmenitiesView';
import ConfiguracionView from './views/ConfiguracionView';
import ViviendasView from './views/ViviendasView';
import LoginView from './views/LoginView';
import EditProfileModal from './components/EditProfileModal';
import { limpiarBajasPendientes } from './components/CambiarResidenteModal';
import { adminApi, PANEL_ROLES, handleUnauthorized, API_BASE_URL, getTenantHeaders } from './services/adminApi';

// Indica si el JWT guardado ya venció (lee `exp` del payload, sin verificar firma)
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch (e) {
    return false;
  }
};

// Recepción de Paquetes oculta hasta definir el flujo (issue #7); poner en true para reactivarla
const PAQUETES_HABILITADO = false;

// Rutas por hash (#/usuarios): funcionan igual con `vite preview` y con un servidor estático
const VIEW_ROUTES: Record<AdminViewType, string> = {
  dashboard: '/',
  access: '/usuarios',
  amenities: '/amenidades',
  announcements: '/anuncios',
  visits: '/garita',
  parcels: '/paquetes',
  pqrs: '/soporte',
  payments: '/pagos',
  viviendas: '/viviendas',
  configuracion: '/configuracion',
};

// Convierte el hash actual en una vista; si la ruta no existe vuelve al panel principal
const getViewFromHash = (): AdminViewType => {
  const route = window.location.hash.replace(/^#/, '') || '/';
  const found = (Object.keys(VIEW_ROUTES) as AdminViewType[]).find((v) => VIEW_ROUTES[v] === route);
  if (found === 'parcels' && !PAQUETES_HABILITADO) return 'dashboard';
  return found || 'dashboard';
};

export default function App() {
  const [currentView, setCurrentView] = useState<AdminViewType>(getViewFromHash);
  const [communityName, setCommunityName] = useState<string>('Residencial Zentary');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const [openPqrsCount, setOpenPqrsCount] = useState(0);
  const [pendingParcelsCount, setPendingParcelsCount] = useState(0);

  // Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('zentary_admin_token');
  });

  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('zentary_admin_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  // Atrás / Adelante del navegador cambian la vista sin salir de la aplicación
  useEffect(() => {
    const onPopState = () => setCurrentView(getViewFromHash());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (view: AdminViewType) => {
    const hash = `#${VIEW_ROUTES[view]}`;
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash);
    }
    setCurrentView(view);
  };

  // El guardia solo usa la garita: el resto de endpoints del panel le responden 403
  const isGuard = adminUser?.role === 'GUARD';

  useEffect(() => {
    if (isGuard && currentView !== 'visits') navigateTo('visits');
  }, [isGuard, currentView]);

  useEffect(() => {
    if (adminToken && !isGuard) {
      fetchCommunityConfig();
    }
  }, [adminToken, isGuard]);

  useEffect(() => {
    if (!adminToken || isGuard) return;
    adminApi.getDashboardStats().then((res) => {
      if (res.success) {
        setOpenPqrsCount(res.stats.openPqrs);
        setPendingParcelsCount(res.stats.pendingParcels);
      }
    }).catch(() => {});
  }, [adminToken, currentView, isGuard]);

  useEffect(() => {
    if (adminToken && isTokenExpired(adminToken)) {
      handleLogout();
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminUser && !PANEL_ROLES.includes(adminUser.role)) {
      handleLogout();
    }
  }, [adminUser]);

  const fetchCommunityConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/community`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, ...getTenantHeaders() },
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (data.success && data.community?.name) {
        setCommunityName(data.community.name);
      }
    } catch (err) {
      console.warn('Failed to fetch community config from DB:', err);
    }
  };

  const handleLoginSuccess = (user: any, token: string) => {
    localStorage.setItem('zentary_admin_token', token);
    localStorage.setItem('zentary_admin_user', JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('zentary_admin_token');
    localStorage.removeItem('zentary_admin_user');
    try { localStorage.removeItem('zentary_selected_tenant'); } catch { /* noop */ }
    limpiarBajasPendientes();
    setAdminToken(null);
    setAdminUser(null);
  };

  const handleProfileUpdated = (updatedUser: any) => {
    const mergedUser = { ...adminUser, ...updatedUser };
    setAdminUser(mergedUser);
    localStorage.setItem('zentary_admin_user', JSON.stringify(mergedUser));
  };

  // If Admin is not logged in, render Login screen
  if (!adminToken) {
    return (
      <LoginView
        communityName={communityName}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const getViewMetadata = () => {
    switch (isGuard ? 'visits' : currentView) {
      case 'dashboard':
        return {
          title: 'Panel Principal',
          subtitle: `Resumen en tiempo real de operaciones en ${communityName}`,
        };
      case 'access':
        return {
          title: 'Control de Usuarios y Accesos',
          subtitle: `Registrar inquilinos y administrar accesos en ${communityName}`,
        };
      case 'amenities':
        return {
          title: 'Amenidades',
          subtitle: `Gestionar espacios comunes y calendario de reservas en ${communityName}`,
        };
      case 'announcements':
        return {
          title: 'Envío de Anuncios',
          subtitle: `Publicar comunicados en los celulares de los residentes de ${communityName}`,
        };
      case 'visits':
        return {
          title: 'Accesos de Garita / QR',
          subtitle: `Monitoreo de ingresos de visitantes y vehículos en ${communityName}`,
        };
      case 'parcels':
        return {
          title: 'Recepción de Paquetes',
          subtitle: `Registro de encomiendas de DHL, FedEx, UPS para ${communityName}`,
        };
      case 'pqrs':
        return {
          title: 'Soporte y PQRS',
          subtitle: `Responder peticiones y quejas de los residentes de ${communityName}`,
        };
      case 'payments':
        return {
          title: 'Gestión de Pagos',
          subtitle: `Emisión de cuotas y seguimiento de transacciones en ${communityName}`,
        };
      case 'viviendas':
        return {
          title: 'Viviendas',
          subtitle: `Viviendas de ${communityName}`,
        };
      case 'configuracion':
        return {
          title: 'Configuración',
          subtitle: `Datos generales, país y zona horaria de ${communityName}`,
        };
      default:
        return {
          title: 'Panel Administrativo',
          subtitle: communityName,
        };
    }
  };

  const metadata = getViewMetadata();

  const renderViewContent = () => {
    switch (isGuard ? 'visits' : currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={(view) => navigateTo(view)} />;
      case 'access':
        return (
          <AccessManagementView
            communityName={communityName}
            onUpdateCommunityName={(newName) => setCommunityName(newName)}
          />
        );
      case 'amenities':
        return <AmenitiesView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'visits':
        return <VisitsLogView />;
      case 'parcels':
        return <ParcelsView />;
      case 'pqrs':
        return <PqrsSupportView />;
      case 'payments':
        return <PaymentsView />;
      case 'viviendas':
        return <ViviendasView />;
      case 'configuracion':
        return <ConfiguracionView />;
      default:
        return <DashboardView onNavigate={(view) => navigateTo(view)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => navigateTo(view)}
        openPqrsCount={openPqrsCount}
        pendingParcelsCount={pendingParcelsCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        adminUser={adminUser}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={metadata.title}
          subtitle={metadata.subtitle}
          communityName={communityName}
          onUpdateCommunityName={(newName) => setCommunityName(newName)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          adminUser={adminUser}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
        />

        {/* Dynamic View Page Body */}
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{renderViewContent()}</main>
      </div>

      {/* Admin Edit Profile Modal */}
      {isEditProfileOpen && adminUser && (
        <EditProfileModal
          currentUser={adminUser}
          token={adminToken}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
}
