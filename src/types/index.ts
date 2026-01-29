export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  snipCount: number;
  progress: number;
  dateAdded: string;
  status: 'in-progress' | 'completed';
  duration: string;
}

export interface Snip {
  id: string;
  videoId: string;
  title: string;
  summary: string[];
  timestampStart: string;
  timestampEnd: string;
  transcript: string;
  quote: string;
  speaker: string;
  isFavorite: boolean;
}

export interface TranscriptSegment {
  time: string;
  text: string;
  isActive?: boolean;
}
