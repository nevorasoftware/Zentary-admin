import React, { useState } from 'react';
import Sidebar, { AdminViewType } from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import AccessManagementView from './views/AccessManagementView';
import AnnouncementsView from './views/AnnouncementsView';
import VisitsLogView from './views/VisitsLogView';
import ParcelsView from './views/ParcelsView';
import PqrsSupportView from './views/PqrsSupportView';
import PaymentsView from './views/PaymentsView';

export default function App() {
  const [currentView, setCurrentView] = useState<AdminViewType>('dashboard');
  const [communityName, setCommunityName] = useState<string>('Residencial Zentary');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    fetchCommunityConfig();
  }, []);

  const fetchCommunityConfig = async () => {
    try {
      const res = await fetch('https://zentary-backend-production.up.railway.app/api/admin/community', {
        headers: { 'Authorization': 'Bearer admin_demo_token' },
      });
      const data = await res.json();
      if (data.success && data.community?.name) {
        setCommunityName(data.community.name);
      }
    } catch (err) {
      console.warn('Failed to fetch community config from DB:', err);
    }
  };

  const getViewMetadata = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Panel Principal',
          subtitle: `Resumen en tiempo real de operaciones en ${communityName}`,
        };
      case 'access':
        return {
          title: 'Control de Usuarios',
          subtitle: `Registrar inquilinos y administrar accesos en ${communityName}`,
        };
      case 'announcements':
        return {
          title: 'Envío de Anuncios',
          subtitle: `Publicar comunicados en los celulares de los residentes de ${communityName}`,
        };
      case 'visits':
        return {
          title: 'Garita y Pases QR',
          subtitle: `Monitoreo de ingresos de visitantes y vehículos en ${communityName}`,
        };
      case 'parcels':
        return {
          title: 'Recepción Paquetes',
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
      default:
        return {
          title: 'Panel Administrativo',
          subtitle: communityName,
        };
    }
  };

  const metadata = getViewMetadata();

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={(view) => setCurrentView(view)} />;
      case 'access':
        return <AccessManagementView communityName={communityName} />;
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
      default:
        return <DashboardView onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={metadata.title}
          subtitle={metadata.subtitle}
          communityName={communityName}
          onUpdateCommunityName={(newName) => setCommunityName(newName)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic View Page Body */}
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{renderViewContent()}</main>
      </div>
    </div>
  );
}
