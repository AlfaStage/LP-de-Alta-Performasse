
import { NextResponse, type NextRequest } from 'next/server';
import { getWhitelabelConfig } from '@/lib/whitelabel.server';
import { getQuizzesList, getOverallQuizAnalytics, getQuizQuestionAnalytics, getQuizAnalyticsBySlug } from '@/app/config/dashboard/quiz/actions';
import type { QuizListItem, OverallQuizStats, QuizQuestionAnalytics, QuizAnalyticsData } from '@/types/quiz';

interface QuizStatsApiResponse {
  overallStats: OverallQuizStats | null;
  quizzes: Array<{
    slug: string;
    title: string;
    dashboardName?: string;
    aggregateStats: QuizAnalyticsData | null;
    questionLevelStats: QuizQuestionAnalytics | null;
  }>;
}

export async function GET(request: NextRequest) {
  const whitelabelSettings = await getWhitelabelConfig();
  const configuredApiToken = whitelabelSettings.apiStatsAccessToken;

  if (!configuredApiToken || configuredApiToken.trim() === "") {
    return NextResponse.json(
      { error: 'Unauthorized: API access token is not configured. Please generate one in the dashboard settings.' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('Authorization');
  const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!providedToken || providedToken !== configuredApiToken) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing access token.' }, { status: 401 });
  }

  try {
    const overallStats = await getOverallQuizAnalytics();
    const quizzesList = await getQuizzesList();
    
    const quizzesDetails = await Promise.all(
      quizzesList.map(async (quizItem: QuizListItem) => {
        const [aggregateStats, questionLevelStats] = await Promise.all([
          getQuizAnalyticsBySlug(quizItem.slug),
          getQuizQuestionAnalytics(quizItem.slug)
        ]);
        return {
          slug: quizItem.slug,
          title: quizItem.title,
          dashboardName: quizItem.dashboardName || quizItem.title,
          aggregateStats,
          questionLevelStats,
        };
      })
    );

    const responsePayload: QuizStatsApiResponse = {
      overallStats,
      quizzes: quizzesDetails,
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error("Error fetching quiz statistics for API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}

