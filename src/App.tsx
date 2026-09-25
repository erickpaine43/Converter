import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { useAnalytics } from './lib/useAnalytics';
import Home from './pages/Home';
import ConverterPage from './pages/ConverterPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { TOOL_IDS, TOOL_SLUGS } from './lib/tools';

export function AppRoutes() {
  useAnalytics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {TOOL_IDS.map(id => (
            <Route key={id} path={`/${TOOL_SLUGS[id]}`} element={<ConverterPage tool={id} />} />
          ))}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <CookieBanner />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
