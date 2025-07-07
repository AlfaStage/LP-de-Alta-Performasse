
import { redirect } from 'next/navigation';

export default function OldDocumentationApiPage() {
  // This page has moved. Redirect to the new location.
  redirect('/config/dashboard/documentation/api');
}
