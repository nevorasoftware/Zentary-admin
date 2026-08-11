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

  const getViewMetadata = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Panel de Control Principal',
          subtitle: 'Resumen en tiempo real de operaciones residenciales y accesos',
        };
      case 'access':
        return {
          title: 'Habilitación de Usuarios y Accesos',
          subtitle: 'Aprobar, activar o suspender el acceso de residentes a la aplicación Zentary Mobile',
        };
      case 'announcements':
        return {
          title: 'Envío y Difusión de Anuncios',
          subtitle: 'Publicar comunicados y avisos en los celulares de los residentes',
        };
      case 'visits':
        return {
          title: 'Control de Garita y Validación QR',
          subtitle: 'Monitoreo de ingresos de visitantes, vehículos y pases QR en garita de entrada',
        };
      case 'parcels':
        return {
          title: 'Recepcionar Paquetes en Garita',
          subtitle: 'Registro de encomiendas de DHL, FedEx, UPS, Cargo Express y Trans Express',
        };
      case 'pqrs':
        return {
          title: 'Soporte y Atención de PQRS',
          subtitle: 'Responder peticiones, quejas, reclamos y solicitudes de residentes',
        };
      case 'payments':
        return {
          title: 'Gestión de Pagos y Mantenimiento',
          subtitle: 'Emisión de cuotas y seguimiento de transacciones registradas',
        };
      default:
        return {
          title: 'Panel Administrativo',
          subtitle: 'Zentary Residential System',
        };
    }
  };

  const metadata = getViewMetadata();

  const renderViewContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={(view) => setCurrentView(view)} />;
      case 'access':
        return <AccessManagementView />;
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={metadata.title} subtitle={metadata.subtitle} />

        {/* Dynamic View Page Body */}
        <main className="p-8 flex-1 overflow-y-auto">{renderViewContent()}</main>
      </div>
    </div>
  );
}
