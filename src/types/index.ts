export interface Song {
  id: number;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string; // Cloudinary stream URL
  cloudinary_id?: string;
  created_at: string;
}

export type RepeatMode = "off" | "all" | "one";

export interface AudioState {
  currentTrack: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  queue: Song[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
}
