import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAudio } from "../context/AudioContext";
import { FullPlayerModal } from "./FullPlayerModal";

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    togglePlayPause,
    playNext,
    positionMillis,
    durationMillis,
  } = useAudio();
  const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

  if (!currentTrack) return null;

  const progressPercent =
    durationMillis > 0 ? (positionMillis / durationMillis) * 100 : 0;

  return (
    <>
      <View style={styles.container}>
        {/* Top Mini Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(progressPercent, 100)}%` },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.content}
          activeOpacity={0.9}
          onPress={() => setFullPlayerVisible(true)}
        >
          {/* Cover Art Icon */}
          <View style={styles.artContainer}>
            <Ionicons name="disc" size={26} color="#A855F7" />
          </View>

          {/* Track Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.titleText} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artistText} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Player Quick Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={togglePlayPause}
              disabled={isBuffering}
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
            >
              {isBuffering ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={22}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={playNext}
              accessibilityLabel="Next Track"
            >
              <Ionicons name="play-skip-forward" size={20} color="#E4E4E7" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* Full Screen Audio Player Modal */}
      <FullPlayerModal
        visible={fullPlayerVisible}
        onClose={() => setFullPlayerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#18181B",
    borderTopWidth: 1,
    borderTopColor: "#27272A",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 99,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: "#27272A",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#A855F7",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  artContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    color: "#F4F4F5",
    fontSize: 14,
    fontWeight: "700",
  },
  artistText: {
    color: "#A1A1AA",
    fontSize: 12,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    padding: 8,
  },
});
