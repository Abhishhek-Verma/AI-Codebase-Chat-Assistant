import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroHeader from '../components/HeroHeader';
import ChatBox from '../components/ChatBox';
import RepoIngestCard from '../components/RepoIngestCard';
import InfoSections from '../components/InfoSections';
import AuthModal from '../components/AuthModal';
import { getRepoStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user, activeRepo } = useAuth();
  const [indexStatus, setIndexStatus] = useState(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    try {
      const status = await getRepoStatus();
      setIndexStatus(status);
    } catch {
      setIndexStatus({ indexed: false, totalChunks: 0 });
    }
  };

  const scrollToChat = () => {
    const chatElement = document.getElementById('chat-section');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSeeHowItWorks = () => {
    scrollToChat();
    if (!indexStatus?.indexed) {
      setTimeout(() => {
        setIsIngestOpen(true);
      }, 400);
    }
  };

  return (
    <div className="sky-canvas-wrapper">
      {/* Ambient background decoration */}
      <div className="ambient-clouds-layer" aria-hidden="true">
        <div className="cloud-blur cloud-1"></div>
        <div className="cloud-blur cloud-2"></div>
        <div className="cloud-blur cloud-3"></div>
      </div>
      <div className="contour-lines-layer" aria-hidden="true">
        <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-100 200 C 300 100, 700 450, 1100 220 C 1300 100, 1500 250, 1600 300"
            stroke="rgba(147, 197, 253, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <path
            d="M-50 400 C 400 300, 800 600, 1200 380 C 1400 280, 1550 400, 1650 420"
            stroke="rgba(255, 140, 90, 0.2)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Floating Navbar with User / Auth Dropdown */}
      <Navbar
        onOpenIngest={() => setIsIngestOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isIndexed={indexStatus?.indexed || false}
        totalChunks={indexStatus?.totalChunks || 0}
        activeRepoName={indexStatus?.repo || activeRepo?.repoUrl}
      />

      {/* Main Page Layout */}
      <main className="main-content-flow">
        {/* Hero Section */}
        <HeroHeader
          onStartClick={() => setIsIngestOpen(true)}
          onExploreClick={handleSeeHowItWorks}
        />

        {/* Chat Section */}
        <section id="chat-section" className="chat-section-wrapper">
          <ChatBox
            isIndexed={indexStatus?.indexed || false}
            onOpenIngest={() => setIsIngestOpen(true)}
          />
        </section>

        {/* Informational Sections: Architecture, How It Works, Features */}
        <InfoSections onOpenIngest={() => setIsIngestOpen(true)} />
      </main>

      {/* Repository Ingestion Modal */}
      <RepoIngestCard
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        indexStatus={indexStatus}
        onIndexed={(newStatus) => {
          setIndexStatus(newStatus);
          setIsIngestOpen(false);
          scrollToChat();
        }}
      />

      {/* Auth / Account Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          fetchStatus();
        }}
      />
    </div>
  );
}
