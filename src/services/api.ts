import { Song } from "../types";

const BACKEND_BASE_URL = "https://music-backend-yghl.vercel.app";
const LOCAL_BACKEND_URL = "http://localhost:3000";

// Helper function to execute request against Vercel backend with automatic fallback
const requestWithFallback = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const primaryUrl = `${BACKEND_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const apiPrefixedUrl = `${BACKEND_BASE_URL}/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const localUrl = `${LOCAL_BACKEND_URL}/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // Try primary backend URL first
  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Primary failed, continue to fallbacks
  }

  // Try /api prefixed backend URL second
  try {
    const res = await fetch(apiPrefixedUrl, options);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // API prefix failed, continue to local
  }

  // Fallback to local server if production backend is unreachable
  const localRes = await fetch(localUrl, options);
  return await localRes.json();
};

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    const data = await requestWithFallback("/api/songs");
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch songs");
    }
    return data.songs || [];
  } catch (error: any) {
    console.error("fetchSongs API Error:", error);
    throw error;
  }
};

export const uploadSong = async (
  fileUri: string,
  fileName: string,
  fileType: string,
  fileBlob?: Blob | File,
  title?: string,
  artist?: string
): Promise<Song> => {
  try {
    const formData = new FormData();

    if (fileBlob) {
      formData.append("file", fileBlob, fileName);
    } else {
      formData.append("file", {
        uri: fileUri,
        name: fileName || "audio.mp3",
        type: fileType || "audio/mpeg",
      } as any);
    }

    if (title) formData.append("title", title);
    if (artist) formData.append("artist", artist);

    const data = await requestWithFallback("/api/songs/upload", {
      method: "POST",
      body: formData,
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to upload song");
    }
    return data.song;
  } catch (error: any) {
    console.error("uploadSong API Error:", error);
    throw error;
  }
};

export const renameSong = async (id: number, title: string, artist?: string): Promise<Song> => {
  try {
    const data = await requestWithFallback(`/api/songs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, artist }),
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to update song");
    }
    return data.song;
  } catch (error: any) {
    console.error("renameSong API Error:", error);
    throw error;
  }
};

export const deleteSong = async (id: number): Promise<void> => {
  try {
    const data = await requestWithFallback(`/api/songs/${id}`, {
      method: "DELETE",
    });

    if (!data.success) {
      throw new Error(data.error || "Failed to delete song");
    }
  } catch (error: any) {
    console.error("deleteSong API Error:", error);
    throw error;
  }
};
