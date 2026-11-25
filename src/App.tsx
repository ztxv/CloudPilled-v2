import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StudyPage } from './pages/Study';
import { LessonPage } from './pages/Lesson';
import { PracticeSetup } from './pages/PracticeSetup';
import { PracticeSessionPage } from './pages/PracticeSession';
import { ResultsPage } from './pages/Results';
import { ReviewPage } from './pages/Review';
import { MockHome } from './pages/MockHome';
import { MockRun } from './pages/MockRun';
import { AtlasPage } from './pages/Atlas';
import { FlashcardsHub } from './pages/Flashcards';
import { FlashSessionPage } from './pages/FlashSession';
import { ProgressPage } from './pages/Progress';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="study" element={<StudyPage />} />
        <Route path="lesson/:id" element={<LessonPage />} />
        <Route path="practice" element={<PracticeSetup />} />
        <Route path="practice/session" element={<PracticeSessionPage />} />
        <Route path="results/:id" element={<ResultsPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="mock" element={<MockHome />} />
        <Route path="mock/run" element={<MockRun />} />
        <Route path="atlas" element={<AtlasPage />} />
        <Route path="flashcards" element={<FlashcardsHub />} />
        <Route path="flashcards/session" element={<FlashSessionPage />} />
        <Route path="atlas/flashcards" element={<Navigate to="/flashcards" replace />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
