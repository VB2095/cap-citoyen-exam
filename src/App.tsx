import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { AppProvider } from "./context/AppContext";
import { ExamPage } from "./pages/ExamPage";
import { GlossaryPage } from "./pages/GlossaryPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PracticePage } from "./pages/PracticePage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ResultsPage } from "./pages/ResultsPage";
import { RevisePage } from "./pages/RevisePage";
import { SourcesPage } from "./pages/SourcesPage";

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reviser" element={<RevisePage />} />
            <Route path="/entrainement" element={<PracticePage />} />
            <Route path="/examen" element={<ExamPage />} />
            <Route path="/resultats" element={<ResultsPage />} />
            <Route path="/glossaire" element={<GlossaryPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
      </AppProvider>
    </BrowserRouter>
  );
}
