
import { redirect } from 'next/navigation';

export default function DocumentationPage() {
  // Redirect to the first and main section of the documentation
  redirect('/config/dashboard/documentation/api');
}
