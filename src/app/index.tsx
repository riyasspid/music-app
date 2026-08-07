import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ManageSongsModal } from "../components/ManageSongsModal";
import { UploadModal } from "../components/UploadModal";
import { useAudio } from "../context/AudioContext";

export default function HomeScreen() {
  const router = useRouter();
  const {
    allSongs,
    isLoadingSongs,
    refreshSongs,
    playSong,
    currentTrack,
    isPlaying,
    togglePlayPause,
  } = useAudio();

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [manageModalVisible, setManageModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSongs();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A855F7"
          />
        }
      >
        {/* App Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Cloud Music Player</Text>
            <Text style={styles.subGreeting}>
              Stream on-demand with background play
            </Text>
          </View>
        </View>

        {/* Main Action Buttons Cards */}
        <Text style={styles.sectionTitle}>Main Controls</Text>
        <View style={styles.actionGrid}>
          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.actionCard, styles.uploadCard]}
            onPress={() => setUploadModalVisible(true)}
          >
            <View style={styles.actionIconCircleUpload}>
              <Ionicons name="cloud-upload" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Upload Song</Text>
            <Text style={styles.actionSubtext}>
              Add new audio file to music library
            </Text>
          </TouchableOpacity>

          {/* Manage Songs Button */}
          <TouchableOpacity
            style={[styles.actionCard, styles.manageCard]}
            onPress={() => setManageModalVisible(true)}
          >
            <View style={styles.actionIconCircleManage}>
              <Ionicons name="settings" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.actionTitle}>Manage Songs</Text>
            <Text style={styles.actionSubtext}>
              Rename title/artist or delete songs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Go to All Songs Banner */}
        <TouchableOpacity
          style={styles.allSongsBanner}
          onPress={() => router.push("/songs" as any)}
        >
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIcon}>
              <Ionicons name="musical-notes" size={24} color="#A855F7" />
            </View>
            <View>
              <Text style={styles.bannerTitle}>View All Songs</Text>
              <Text style={styles.bannerSubtitle}>
                {allSongs.length} tracks available in library
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#A855F7" />
        </TouchableOpacity>

        {/* Recent / Library Preview Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Library Preview</Text>
          <TouchableOpacity onPress={() => router.push("/songs" as any)}>
            <Text style={styles.seeAllText}>See All ({allSongs.length})</Text>
          </TouchableOpacity>
        </View>

        {isLoadingSongs ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.loaderText}>
              Fetching songs from database...
            </Text>
          </View>
        ) : allSongs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="musical-notes-outline" size={48} color="#52525B" />
            <Text style={styles.emptyTitle}>No Songs Uploaded Yet</Text>
            <Text style={styles.emptySub}>
              Tap "Upload Song" above to add your first track!
            </Text>
            <TouchableOpacity
              style={styles.uploadNowBtn}
              onPress={() => setUploadModalVisible(true)}
            >
              <Text style={styles.uploadNowBtnText}>Upload Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          allSongs.slice(0, 5).map((song, idx) => {
            const isPlayingThis = currentTrack?.id === song.id;
            return (
              <TouchableOpacity
                key={song.id}
                style={[
                  styles.songCard,
                  isPlayingThis && styles.songCardPlaying,
                ]}
                onPress={() => playSong(song, allSongs, idx)}
              >
                <View style={styles.songCardIcon}>
                  <Ionicons
                    name={isPlayingThis && isPlaying ? "disc" : "play-circle"}
                    size={28}
                    color={isPlayingThis ? "#C084FC" : "#A855F7"}
                  />
                </View>
                <View style={styles.songCardInfo}>
                  <Text
                    style={[
                      styles.songCardTitle,
                      isPlayingThis && styles.textPlaying,
                    ]}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>
                </View>
                {isPlayingThis && (
                  <TouchableOpacity
                    onPress={togglePlayPause}
                    style={styles.quickPlayBtn}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Upload Modal */}
      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
      />

      {/* Manage Songs Modal */}
      <ManageSongsModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F4F4F5",
  },
  subGreeting: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0C4A6E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0284C7",
  },
  badgeText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
  },
  seeAllText: {
    color: "#A855F7",
    fontSize: 14,
    fontWeight: "600",
  },
  actionGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  uploadCard: {
    backgroundColor: "#1E102E",
    borderColor: "#A855F7",
  },
  manageCard: {
    backgroundColor: "#0F172A",
    borderColor: "#0284C7",
  },
  actionIconCircleUpload: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionIconCircleManage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    color: "#F4F4F5",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionSubtext: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 16,
  },
  allSongsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#18181B",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 24,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: "#F4F4F5",
    fontSize: 16,
    fontWeight: "700",
  },
  bannerSubtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
  loaderContainer: {
    padding: 40,
    alignItems: "center",
  },
  loaderText: {
    color: "#A1A1AA",
    marginTop: 12,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: "#18181B",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27272A",
  },
  emptyTitle: {
    color: "#F4F4F5",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySub: {
    color: "#71717A",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  uploadNowBtn: {
    backgroundColor: "#9333EA",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadNowBtnText: {
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
  songCardIcon: {
    marginRight: 12,
  },
  songCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  songCardTitle: {
    color: "#F4F4F5",
    fontSize: 15,
    fontWeight: "600",
  },
  textPlaying: {
    color: "#C084FC",
  },
  songCardArtist: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
  quickPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
});
