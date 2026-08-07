import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Song } from "../types";
import { renameSong, deleteSong } from "../services/api";
import { useAudio } from "../context/AudioContext";

interface ManageSongsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ManageSongsModal: React.FC<ManageSongsModalProps> = ({ visible, onClose }) => {
  const { allSongs, refreshSongs, currentTrack } = useAudio();

  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // In-app Delete Confirmation Popup State
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const startEdit = (song: Song) => {
    setEditingSongId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  };

  const cancelEdit = () => {
    setEditingSongId(null);
    setEditTitle("");
    setEditArtist("");
  };

  const handleSaveRename = async (id: number) => {
    if (!editTitle.trim()) {
      showToast("Song title cannot be empty.");
      return;
    }

    setLoadingId(id);
    try {
      await renameSong(id, editTitle.trim(), editArtist.trim() || "Unknown Artist");
      showToast("Song renamed successfully!");
      cancelEdit();
      await refreshSongs();
    } catch (error: any) {
      showToast(error.message || "Failed to rename song.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!songToDelete) return;

    const targetSong = songToDelete;
    setLoadingId(targetSong.id);
    setSongToDelete(null);

    try {
      await deleteSong(targetSong.id);
      showToast(`"${targetSong.title}" deleted.`);
      await refreshSongs();
    } catch (error: any) {
      showToast(error.message || "Failed to delete song.");
    } finally {
      setLoadingId(null);
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const renderItem = ({ item }: { item: Song }) => {
    const isEditing = editingSongId === item.id;
    const isLoading = loadingId === item.id;
    const isCurrentPlaying = currentTrack?.id === item.id;

    if (isEditing) {
      return (
        <View style={styles.editCard}>
          <Text style={styles.editHeader}>Editing Song</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
            placeholder="Title"
            placeholderTextColor="#71717A"
          />
          <View style={styles.editBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => handleSaveRename(item.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.songCard, isCurrentPlaying && styles.songCardPlaying]}>
        <View style={styles.songIconContainer}>
          <Ionicons name="musical-notes" size={22} color={isCurrentPlaying ? "#C084FC" : "#A1A1AA"} />
        </View>

        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, isCurrentPlaying && styles.songTitlePlaying]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {isLoading ? (
            <ActivityIndicator color="#A855F7" size="small" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => startEdit(item)}
                accessibilityLabel="Rename song"
              >
                <Ionicons name="create-outline" size={20} color="#38BDF8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setSongToDelete(item)}
                accessibilityLabel="Delete song"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="settings-outline" size={24} color="#A855F7" />
                <Text style={styles.headerTitle}>Manage Songs ({allSongs.length})</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-circle-outline" size={28} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {/* In-App Notification Toast */}
            {toastMessage && (
              <View style={styles.toastBanner}>
                <Ionicons name="information-circle" size={18} color="#38BDF8" style={{ marginRight: 6 }} />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            )}

            {allSongs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#52525B" />
                <Text style={styles.emptyText}>No songs available to manage yet.</Text>
              </View>
            ) : (
              <FlatList
                data={allSongs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Sleek In-App Custom Delete Confirmation Popup */}
      <Modal visible={!!songToDelete} animationType="fade" transparent onRequestClose={() => setSongToDelete(null)}>
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            <View style={styles.popupIconCircle}>
              <Ionicons name="trash" size={32} color="#EF4444" />
            </View>

            <Text style={styles.popupTitle}>Delete Song?</Text>
            <Text style={styles.popupSubtitle}>
              Are you sure you want to delete <Text style={{ color: "#F4F4F5", fontWeight: "700" }}>"{songToDelete?.title}"</Text>? This action cannot be undone.
            </Text>

            <View style={styles.popupBtnRow}>
              <TouchableOpacity style={styles.popupCancelBtn} onPress={() => setSongToDelete(null)}>
                <Text style={styles.popupCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.popupDeleteBtn} onPress={handleConfirmDelete}>
                <Text style={styles.popupDeleteBtnText}>Delete Song</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    backgroundColor: "#18181B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0284C7",
  },
  toastText: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#71717A",
    fontSize: 14,
    marginTop: 12,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090B",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  songCardPlaying: {
    borderColor: "#A855F7",
    backgroundColor: "#1E102E",
  },
  songIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    color: "#F4F4F5",
    fontSize: 15,
    fontWeight: "600",
  },
  songTitlePlaying: {
    color: "#C084FC",
  },
  songArtist: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#27272A",
  },
  editCard: {
    backgroundColor: "#09090B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#38BDF8",
  },
  editHeader: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#18181B",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F4F4F5",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 10,
  },
  editBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#27272A",
  },
  cancelBtnText: {
    color: "#A1A1AA",
    fontWeight: "600",
    fontSize: 13,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#0284C7",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  // Popup Dialog Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  popupBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#18181B",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#27272A",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  popupIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#27171A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  popupTitle: {
    color: "#F4F4F5",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  popupSubtitle: {
    color: "#A1A1AA",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  popupBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  popupCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  popupCancelBtnText: {
    color: "#D4D4D8",
    fontSize: 14,
    fontWeight: "600",
  },
  popupDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  popupDeleteBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
