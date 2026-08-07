import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Song, RepeatMode } from "../types";
import { fetchSongs } from "../services/api";

interface AudioContextType {
  allSongs: Song[];
  queue: Song[];
  queueIndex: number;
  currentTrack: Song | null;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isLoadingSongs: boolean;
  refreshSongs: () => Promise<void>;
  playSong: (song: Song, customQueue?: Song[], index?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState<boolean>(true);

  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(0);

  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const soundRef = useRef<Audio.Sound | null>(null);
  const isChangingTrackRef = useRef<boolean>(false);

  // Configure Audio Mode for Background Playback on Mount
  useEffect(() => {
    async function setupAudioMode() {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          allowsRecordingIOS: false,
        });
      } catch (error) {
        console.warn("Could not set audio mode for background play:", error);
      }
    }
    setupAudioMode();
    loadAllSongs();
  }, []);

  // Web MediaSession Integration for OS / Lockscreen / Browser Background Playback Controls
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator && currentTrack) {
      try {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: "My Music Hub",
          artwork: [
            {
              src: "https://res.cloudinary.com/demo/image/upload/v1688648342/music_cover.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
          togglePlayPause();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          togglePlayPause();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          playPrevious();
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          playNext();
        });
      } catch (e) {
        console.warn("MediaSession API notice:", e);
      }
    }
  }, [currentTrack]);

  const loadAllSongs = async () => {
    setIsLoadingSongs(true);
    try {
      const songs = await fetchSongs();
      setAllSongs(songs);
    } catch (err) {
      console.error("Error loading songs in AudioContext:", err);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  // Unload previous sound to optimize network data and memory usage
  const cleanupCurrentSound = async () => {
    if (soundRef.current) {
      try {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (err) {
        console.warn("Error cleaning up sound:", err);
      } finally {
        soundRef.current = null;
      }
    }
  };

  // Handle audio playback status updates (Progress, Buffering, Autoplay next track)
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error("Playback status error:", status.error);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsBuffering(status.isBuffering);
    setPositionMillis(status.positionMillis || 0);
    setDurationMillis(status.durationMillis || (currentTrack?.duration ? currentTrack.duration * 1000 : 0));

    // Handle AUTOPLAY when current song finishes
    if (status.didJustFinish && !isChangingTrackRef.current) {
      handleTrackEnd();
    }
  };

  const handleTrackEnd = async () => {
    isChangingTrackRef.current = true;
    if (repeatMode === "one" && currentTrack) {
      // Replay same song
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
      isChangingTrackRef.current = false;
    } else {
      // Advance to next song in queue
      await playNextInternal();
      isChangingTrackRef.current = false;
    }
  };

  // Streams song on demand from Cloudinary URL (Data Optimized)
  const loadAndPlayTrack = async (song: Song) => {
    try {
      await cleanupCurrentSound();
      setCurrentTrack(song);
      setIsPlaying(false);
      setIsBuffering(true);
      setPositionMillis(0);
      setDurationMillis(song.duration ? song.duration * 1000 : 0);

      // Only stream this single selected song URL from Cloudinary
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: song.url },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
      } catch (primaryErr) {
        console.warn("Primary stream load issue, attempting fallback Cloudinary stream:", primaryErr);
        const fallbackUrl = "https://res.cloudinary.com/demo/video/upload/dog.mp3";
        const { sound } = await Audio.Sound.createAsync(
          { uri: fallbackUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
      }

      setIsPlaying(true);
      setIsBuffering(false);
    } catch (error) {
      console.error("Failed to load/stream audio track:", error);
      setIsBuffering(false);
      setIsPlaying(false);
    }
  };

  const playSong = async (song: Song, customQueue?: Song[], index?: number) => {
    const targetQueue = customQueue || (allSongs.length > 0 ? allSongs : [song]);
    const targetIndex = index !== undefined && index >= 0 ? index : targetQueue.findIndex((s) => s.id === song.id);

    setQueue(targetQueue);
    setQueueIndex(targetIndex >= 0 ? targetIndex : 0);

    await loadAndPlayTrack(song);
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) {
      if (currentTrack) {
        await loadAndPlayTrack(currentTrack);
      } else if (allSongs.length > 0) {
        await playSong(allSongs[0], allSongs, 0);
      }
      return;
    }

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } else {
        if (currentTrack) {
          await loadAndPlayTrack(currentTrack);
        }
      }
    } catch (err) {
      console.warn("Error toggling play/pause:", err);
    }
  };

  const playNextInternal = async () => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        // End of queue
        setIsPlaying(false);
        setPositionMillis(0);
        return;
      }
    }

    setQueueIndex(nextIndex);
    const nextSong = queue[nextIndex];
    if (nextSong) {
      await loadAndPlayTrack(nextSong);
    }
  };

  const playNext = async () => {
    await playNextInternal();
  };

  const playPrevious = async () => {
    if (positionMillis > 3000 && soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIndex = queueIndex - 1;
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    setQueueIndex(prevIndex);
    const prevSong = queue[prevIndex];
    if (prevSong) {
      await loadAndPlayTrack(prevSong);
    }
  };

  const seekTo = async (millis: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(millis);
      setPositionMillis(millis);
    }
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueIndex(-1);
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };

  return (
    <AudioContext.Provider
      value={{
        allSongs,
        queue,
        queueIndex,
        currentTrack,
        isPlaying,
        isBuffering,
        positionMillis,
        durationMillis,
        isShuffle,
        repeatMode,
        isLoadingSongs,
        refreshSongs: loadAllSongs,
        playSong,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
