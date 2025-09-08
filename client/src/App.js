import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CreateCaseStudy from './components/CreateCaseStudy';
import ViewCaseStudies from './components/ViewCaseStudies';
import ManageCaseStudies from './components/ManageCaseStudies';
import ReviewCaseStudies from './components/ReviewCaseStudies';
import DraftReview from './components/DraftReview';
import ManageLabels from './components/ManageLabels';
import CaseStudyPreview from './components/CaseStudyPreview';
import './App.css';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h1>Case Study Catalog</h1>
      </div>
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Browse Case Studies
        </Link>
        <Link 
          to="/create" 
          className={`nav-link ${location.pathname === '/create' ? 'active' : ''}`}
        >
          Create Case Study
        </Link>
        <Link 
          to="/manage" 
          className={`nav-link ${location.pathname === '/manage' ? 'active' : ''}`}
        >
          Manage Case Studies
        </Link>
        <Link 
          to="/manage-labels" 
          className={`nav-link ${location.pathname === '/manage-labels' ? 'active' : ''}`}
        >
          Manage Labels
        </Link>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Navigation />
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ViewCaseStudies />} />
            <Route path="/create" element={<CreateCaseStudy />} />
            <Route path="/edit-draft/:draftId" element={<CreateCaseStudy />} />
            <Route path="/manage" element={<ManageCaseStudies />} />
            <Route path="/review/:folderName" element={<ReviewCaseStudies />} />
            <Route path="/review-draft/:draftId" element={<DraftReview />} />
            <Route path="/manage-labels" element={<ManageLabels />} />
            <Route path="/preview/:id" element={<CaseStudyPreview />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>&copy; 2025 Case Study Catalog | Ascendion</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
