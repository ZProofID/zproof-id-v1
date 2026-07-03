import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import HumanityGame from "./pages/games/HumanityGame";
import "./App.css";
import LandingPage from "./pages/home/LandingPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import NotFoundPage from "./pages/home/NotFoundPage";
import Layout from "./common/Layout";
import { StatesProvider } from "./contexts/StatesContext";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <StatesProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="verify" element={<HumanityGame />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StatesProvider>
    </Router>
  );
}

export default App;
