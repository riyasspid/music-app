import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../context/AudioContext";
import { Song } from "../types";
import { UploadModal } from "../components/UploadModal";
import { ManageSongsModal } from "../components/ManageSongsModal";

export default function SongsScreen() {
  const {
    allSongs,
    isLoadingSongs,
    refreshSongs,
    playSong,
    currentTrack,
    isPlaying,
    addToQueue,
  } = useAudio();

  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // In-App Options Menu & Toast State
  const [activeSongMenu, setActiveSongMenu] = useState<Song | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredSongs = allSongs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSongs();
    setRefreshing(false);
  };

  const formatDuration = (secs: number) => {
    if (!secs) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playSong(filteredSongs[0], filteredSongs, 0);
    }
  };

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentPlaying = currentTrack?.id === item.id;

    return (
      <View style={[styles.songCard, isCurrentPlaying && styles.songCardPlaying]}>
        {/* Play Action / Playing Waveform Icon */}
        <TouchableOpacity
          style={styles.playIconContainer}
          onPress={() => playSong(item, filteredSongs, index)}
        >
          <Ionicons
            name={isCurrentPlaying && isPlaying ? "pause-circle" : "play-circle"}
            size={36}
            color={isCurrentPlaying ? "#C084FC" : "#A855F7"}
          />
        </TouchableOpacity>

        {/* Info */}
        <TouchableOpacity
          style={styles.songMainInfo}
          onPress={() => playSong(item, filteredSongs, index)}
        >
          <Text style={[styles.songTitle, isCurrentPlaying && styles.songTitlePlaying]} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>

        {/* In-App Options Menu Button */}
        <View style={styles.songActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setActiveSongMenu(item)}
            accessibilityLabel="Song Options Menu"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#A1A1AA" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#71717A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search songs or artists..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.manageHeaderBtn} onPress={() => setManageModalVisible(true)}>
          <Ionicons name="options-outline" size={22} color="#F4F4F5" />
        </TouchableOpacity>
      </View>

      {/* In-App Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Stats Bar & Play All */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{filteredSongs.length} Songs Found</Text>
        {filteredSongs.length > 0 && (
          <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
            <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Song List */}
      {isLoadingSongs ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
          <Text style={styles.loadingText}>Loading song library...</Text>
        </View>
      ) : filteredSongs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="disc-outline" size={56} color="#52525B" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? "No matching songs found" : "No songs in library"}
          </Text>
          <Text style={styles.emptySub}>
            {searchQuery ? "Try a different search term" : "Upload your first audio file to get started!"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity style={styles.uploadBtn} onPress={() => setUploadModalVisible(true)}>
              <Ionicons name="cloud-upload" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnText}>Upload Song</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSongItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setUploadModalVisible(true)}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* In-App Song Options Menu Popup Sheet */}
      <Modal visible={!!activeSongMenu} animationType="slide" transparent onRequestClose={() => setActiveSongMenu(null)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setActiveSongMenu(null)}>
          <View style={styles.menuSheet}>
            <View style={styles.menuHandle} />

            {/* Song Details Header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle} numberOfLines={1}>
                {activeSongMenu?.title}
              </Text>
            </View>

            {/* Menu Options */}
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                if (activeSongMenu) {
                  playSong(activeSongMenu, filteredSongs);
                  setActiveSongMenu(null);
                }
              }}
            >
              <Ionicons name="play-circle-outline" size={22} color="#A855F7" style={styles.optionIcon} />
              <Text style={styles.optionText}>Play Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                if (activeSongMenu) {
                  addToQueue(activeSongMenu);
                  showToast(`"${activeSongMenu.title}" added to queue.`);
                  setActiveSongMenu(null);
                }
              }}
            >
              <Ionicons name="list-outline" size={22} color="#38BDF8" style={styles.optionIcon} />
              <Text style={styles.optionText}>Add to Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setActiveSongMenu(null);
                setManageModalVisible(true);
              }}
            >
              <Ionicons name="settings-outline" size={22} color="#F59E0B" style={styles.optionIcon} />
              <Text style={styles.optionText}>Manage Songs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuCloseBtn} onPress={() => setActiveSongMenu(null)}>
              <Text style={styles.menuCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modals */}
      <UploadModal visible={uploadModalVisible} onClose={() => setUploadModalVisible(false)} />
      <ManageSongsModal visible={manageModalVisible} onClose={() => setManageModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  searchInput: {
    flex: 1,
    color: "#F4F4F5",
    fontSize: 14,
  },
  manageHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  toastBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#065F46",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  toastText: {
    color: "#D1FAE5",
    fontSize: 13,
    fontWeight: "600",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statsText: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9333EA",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playAllText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    color: "#A1A1AA",
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySub: {
    color: "#71717A",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#9333EA",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  songCardPlaying: {
    borderColor: "#A855F7",
    backgroundColor: "#1E102E",
  },
  playIconContainer: {
    marginRight: 10,
  },
  songMainInfo: {
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
  songSubtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
  songActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconBtn: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 90,
  },
  // In-App Options Menu Sheet Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#18181B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  menuHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#3F3F46",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  menuHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  menuTitle: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "700",
  },
  menuSubtitle: {
    color: "#A1A1AA",
    fontSize: 13,
    marginTop: 2,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  optionIcon: {
    marginRight: 14,
  },
  optionText: {
    color: "#F4F4F5",
    fontSize: 15,
    fontWeight: "600",
  },
  menuCloseBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#27272A",
    alignItems: "center",
  },
  menuCloseText: {
    color: "#A1A1AA",
    fontSize: 14,
    fontWeight: "700",
  },
});
