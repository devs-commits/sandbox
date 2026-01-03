import { OfficeProvider, useOffice } from './../../contexts/OfficeContext';
import { LobbyScreen } from '../../components/students/office/LobbyScreen';
import { OfficeDashboard } from '../../components/students/office/OfficeDashboard';

function OfficeContent() {
  const { phase } = useOffice();

  if (phase === 'lobby') {
    return <LobbyScreen />;
  }

  return <OfficeDashboard />;
}

export const Office = () => {
  return (
    <OfficeProvider>
      <OfficeContent />
    </OfficeProvider>
  );
};
