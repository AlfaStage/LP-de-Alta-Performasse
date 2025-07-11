
import { redirect } from 'next/navigation';

// This page's content has been moved to the new consolidated AI settings page.
// Redirect any legacy bookmarks to the new location.
export default function OldPromptsSettingsPage() {
  redirect('/config/dashboard/settings/ai');
}
