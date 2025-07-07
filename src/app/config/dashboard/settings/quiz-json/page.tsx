
import { redirect } from 'next/navigation';

export default function OldQuizJsonGuidePage() {
  // This page has moved. Redirect to the new location.
  redirect('/config/dashboard/documentation/quiz-json');
}
