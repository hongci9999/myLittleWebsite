import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/shared/context/ThemeContext'
import Layout from './components/Layout'
import DesignPlaygroundPage from './pages/DesignPlaygroundPage'
import LandingPage from './pages/LandingPage'
import MainPage from './pages/MainPage'
import PortfolioPage from './pages/PortfolioPage'
import LearningPage from './pages/LearningPage'
import ColumnPage from './pages/ColumnPage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/design-playground" element={<DesignPlaygroundPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="main" element={<MainPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="learning" element={<LearningPage />} />
          <Route path="column" element={<ColumnPage />} />
          <Route path="project" element={<ProjectPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
