import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudio } from "../context/AudioContext";
import { Song } from "../types";

const { width } = Dimensions.get("window");

interface FullPlayerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({ visible, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    positionMillis,
    durationMillis,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    queue,
    queueIndex,
    playSong,
    removeFromQueue,
  } = useAudio();

  const [showQueue, setShowQueue] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0); // 0 to 1
  const [seekbarWidth, setSeekbarWidth] = useState(width - 48);

  if (!currentTrack) return null;

  const formatTime = (millis: number) => {
    if (!millis || isNaN(millis)) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = isSeeking
    ? seekProgress * 100
    : durationMillis > 0
    ? (positionMillis / durationMillis) * 100
    : 0;

  const displayedCurrentTime = isSeeking
    ? formatTime(seekProgress * durationMillis)
    : formatTime(positionMillis);

  // Dragging & Touch Handlers for timeline seeking
  const handleTouchStart = (evt: any) => {
    if (durationMillis <= 0) return;
    setIsSeeking(true);
    const touchX = evt.nativeEvent.locationX;
    const progress = Math.max(0, Math.min(1, touchX / seekbarWidth));
    setSeekProgress(progress);
  };

  const handleTouchMove = (evt: any) => {
    if (!isSeeking || durationMillis <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const progress = Math.max(0, Math.min(1, touchX / seekbarWidth));
    setSeekProgress(progress);
  };

  const handleTouchEnd = (evt: any) => {
    if (durationMillis <= 0) return;
    const touchX = evt.nativeEvent.locationX;
    const progress = Math.max(0, Math.min(1, touchX / seekbarWidth));
    seekTo(progress * durationMillis);
    setIsSeeking(false);
  };

  const renderQueueItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrent = index === queueIndex;

    return (
      <View style={[styles.queueItem, isCurrent && styles.queueItemCurrent]}>
        <TouchableOpacity
          style={styles.queueItemContent}
          onPress={() => playSong(item, queue, index)}
        >
          <Ionicons
            name={isCurrent ? "volume-high" : "musical-note"}
            size={18}
            color={isCurrent ? "#C084FC" : "#71717A"}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.queueTitle, isCurrent && styles.queueTitleCurrent]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => removeFromQueue(index)} style={{ padding: 6 }}>
          <Ionicons name="close" size={18} color="#71717A" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="chevron-down" size={28} color="#F4F4F5" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Now Playing</Text>

          <TouchableOpacity onPress={() => setShowQueue(!showQueue)} style={styles.headerBtn}>
            <Ionicons name="list" size={24} color={showQueue ? "#A855F7" : "#F4F4F5"} />
          </TouchableOpacity>
        </View>

        {showQueue ? (
          /* Queue View */
          <View style={styles.queueContainer}>
            <Text style={styles.queueSectionTitle}>Playing Queue ({queue.length})</Text>
            <FlatList
              data={queue}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={renderQueueItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        ) : (
          /* Main Artwork & Player View */
          <View style={styles.playerMainView}>
            {/* Album Artwork Container */}
            <View style={styles.artworkWrapper}>
              <View style={[styles.artworkCircle, isPlaying && styles.artworkActive]}>
                <Ionicons name="disc" size={140} color="#A855F7" />
              </View>
            </View>

            {/* Track Info */}
            <View style={styles.trackDetails}>
              <Text style={styles.trackTitle} numberOfLines={2}>
                {currentTrack.title}
              </Text>
            </View>

            {/* Interactive Drag & Touch Progress Slider */}
            <View style={styles.progressContainer}>
              <View
                style={styles.touchableProgressBar}
                onLayout={(e) => setSeekbarWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleTouchStart}
                onResponderMove={handleTouchMove}
                onResponderRelease={handleTouchEnd}
                onResponderTerminate={handleTouchEnd}
              >
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                  <View style={[styles.progressKnob, { left: `${Math.min(progressPercent, 98)}%` }]} />
                </View>
              </View>

              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{displayedCurrentTime}</Text>
                <Text style={styles.timeText}>{formatTime(durationMillis)}</Text>
              </View>
            </View>

            {/* Transport Controls */}
            <View style={styles.controlsRow}>
              {/* Shuffle */}
              <TouchableOpacity onPress={toggleShuffle} style={styles.secondaryControlBtn}>
                <Ionicons name="shuffle" size={22} color={isShuffle ? "#A855F7" : "#71717A"} />
              </TouchableOpacity>

              {/* Skip Previous */}
              <TouchableOpacity onPress={playPrevious} style={styles.secondaryControlBtn}>
                <Ionicons name="play-skip-back" size={28} color="#F4F4F5" />
              </TouchableOpacity>

              {/* Play / Pause */}
              <TouchableOpacity onPress={togglePlayPause} disabled={isBuffering} style={styles.mainPlayBtn}>
                {isBuffering ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Skip Next */}
              <TouchableOpacity onPress={playNext} style={styles.secondaryControlBtn}>
                <Ionicons name="play-skip-forward" size={28} color="#F4F4F5" />
              </TouchableOpacity>

              {/* Repeat Mode */}
              <TouchableOpacity onPress={toggleRepeat} style={styles.secondaryControlBtn}>
                <Ionicons
                  name={repeatMode === "one" ? "repeat" : "repeat-outline"}
                  size={22}
                  color={repeatMode !== "off" ? "#A855F7" : "#71717A"}
                />
                {repeatMode === "one" && <Text style={styles.repeatBadge}>1</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    color: "#F4F4F5",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  playerMainView: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  artworkWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  artworkCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#18181B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#27272A",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  artworkActive: {
    borderColor: "#9333EA",
  },
  trackDetails: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  trackTitle: {
    color: "#F4F4F5",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  trackArtist: {
    color: "#A1A1AA",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  cloudBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cloudBadgeText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "600",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  touchableProgressBar: {
    paddingVertical: 14,
    width: "100%",
    justifyContent: "center",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#27272A",
    borderRadius: 4,
    position: "relative",
    overflow: "visible",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#A855F7",
    borderRadius: 4,
  },
  progressKnob: {
    position: "absolute",
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    marginLeft: -9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    color: "#71717A",
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  secondaryControlBtn: {
    padding: 12,
    position: "relative",
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  repeatBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    color: "#A855F7",
    fontSize: 10,
    fontWeight: "800",
  },
  queueContainer: {
    flex: 1,
    width: "100%",
  },
  queueSectionTitle: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181B",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  queueItemCurrent: {
    borderColor: "#A855F7",
    borderWidth: 1,
    backgroundColor: "#1E102E",
  },
  queueItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  queueTitle: {
    color: "#F4F4F5",
    fontSize: 14,
    fontWeight: "600",
  },
  queueTitleCurrent: {
    color: "#C084FC",
  },
  queueArtist: {
    color: "#A1A1AA",
    fontSize: 12,
  },
});
