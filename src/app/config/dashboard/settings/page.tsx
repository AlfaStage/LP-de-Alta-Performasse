import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redireciona para a primeira e principal seção das configurações
  redirect('/config/dashboard/settings/general');
}
