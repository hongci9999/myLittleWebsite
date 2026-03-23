import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/shared/context/ThemeContext'
import { AuthProvider } from '@/shared/context/AuthContext'
import Layout from './components/Layout'
import DesignPlaygroundPage from './pages/DesignPlaygroundPage'
import LandingPage from './pages/LandingPage'
import MainPage from './pages/MainPage'
import PortfolioPage from './pages/PortfolioPage'
import LearningPage from './pages/LearningPage'
import LearningBrowserPage from './pages/LearningBrowserPage'
import ColumnPage from './pages/ColumnPage'
import ColumnScrapDetailPage from './pages/ColumnScrapDetailPage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import PatchNotesPage from './pages/PatchNotesPage'
import LinksPage from './pages/LinksPage'
import LinksAdminPage from './pages/LinksAdminPage'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import ImpeccableSkillsIntroPage from './pages/ImpeccableSkillsIntroPage'
import AiDevToolsPage from './pages/AiDevToolsPage'
import AiDevToolScrapDetailPage from './pages/AiDevToolScrapDetailPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/design-playground" element={<DesignPlaygroundPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="main" element={<MainPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="ai-dev-tools" element={<AiDevToolsPage />} />
          <Route path="ai-dev-tools/:slug" element={<AiDevToolScrapDetailPage />} />
          <Route path="patch-notes" element={<PatchNotesPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="learning" element={<LearningPage />} />
          <Route
            path="learning/:sectionId/*"
            element={<LearningBrowserPage />}
          />
          <Route path="column" element={<ColumnPage />} />
          <Route path="column/:slug" element={<ColumnScrapDetailPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="links/admin" element={<LinksAdminPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="skills-intro" element={<ImpeccableSkillsIntroPage />} />
          <Route path="project" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
