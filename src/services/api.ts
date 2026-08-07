import { Song } from "../types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/songs`);
    const data = await response.json();
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

    const response = await fetch(`${API_BASE_URL}/songs/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, artist }),
    });

    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete song");
    }
  } catch (error: any) {
    console.error("deleteSong API Error:", error);
    throw error;
  }
};
