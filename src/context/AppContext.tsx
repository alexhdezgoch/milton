import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Video, Snip } from '../types';
import { mockVideos, mockSnips } from '../data/mockData';

interface AppContextType {
  videos: Video[];
  snips: Snip[];
  selectedVideoId: string | null;
  setSelectedVideoId: (id: string | null) => void;
  toggleSnipFavorite: (snipId: string) => void;
  addSnip: () => void;
  mobileView: 'library' | 'player';
  setMobileView: (view: 'library' | 'player') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [videos] = useState<Video[]>(mockVideos);
  const [snips, setSnips] = useState<Snip[]>(mockSnips);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>('1');
  const [mobileView, setMobileView] = useState<'library' | 'player'>('library');

  const toggleSnipFavorite = (snipId: string) => {
    setSnips(prev => prev.map(snip =>
      snip.id === snipId ? { ...snip, isFavorite: !snip.isFavorite } : snip
    ));
  };

  const addSnip = () => {
    const newSnip: Snip = {
      id: `${Date.now()}`,
      videoId: selectedVideoId || '1',
      title: 'New Snip',
      summary: ['Processing...', 'AI will generate summary shortly'],
      timestampStart: '25:30',
      timestampEnd: '26:15',
      transcript: 'Transcript will be extracted from the video...',
      quote: 'Quote will be identified by AI...',
      speaker: 'Speaker',
      isFavorite: false,
    };
    setSnips(prev => [newSnip, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      videos,
      snips,
      selectedVideoId,
      setSelectedVideoId,
      toggleSnipFavorite,
      addSnip,
      mobileView,
      setMobileView,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
