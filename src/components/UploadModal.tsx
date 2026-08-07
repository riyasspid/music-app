import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { uploadSong } from "../services/api";
import { useAudio } from "../context/AudioContext";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ visible, onClose }) => {
  const { refreshSongs } = useAudio();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/flac", "audio/aac"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile(asset);
        if (!title) {
          const cleanName = asset.name.replace(/\.[^/.]+$/, "");
          setTitle(cleanName);
        }
      }
    } catch (err) {
      console.error("Document picking error:", err);
      showError("Could not pick audio file.");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showError("Please select an audio file to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await uploadSong(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType || "audio/mpeg",
        selectedFile.file, // for web browser upload
        title.trim(),
        ""
      );

      setSelectedFile(null);
      setTitle("");
      setArtist("");
      await refreshSongs();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(error.message || "Failed to upload song. Check backend connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setTitle("");
      setArtist("");
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upload New Song</Text>
            <TouchableOpacity onPress={handleClose} disabled={isUploading}>
              <Ionicons name="close-circle-outline" size={28} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* In-App Error Notification Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* File Picker Section */}
          <TouchableOpacity style={styles.filePickerButton} onPress={handlePickAudio} disabled={isUploading}>
            <Ionicons name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"} size={36} color={selectedFile ? "#10B981" : "#A855F7"} />
            <Text style={styles.filePickerText}>
              {selectedFile ? selectedFile.name : "Tap to Select Audio File (.mp3, .wav, .m4a)"}
            </Text>
            {selectedFile && (
              <Text style={styles.fileSizeText}>
                {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "File Ready"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Metadata Inputs */}
          <Text style={styles.label}>Song Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Midnight Waves"
            placeholderTextColor="#71717A"
            value={title}
            onChangeText={setTitle}
            editable={!isUploading}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={isUploading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Upload Song</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#18181B",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27171A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  filePickerButton: {
    borderWidth: 2,
    borderColor: "#3F3F46",
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090B",
    marginBottom: 20,
  },
  filePickerText: {
    color: "#E4E4E7",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  fileSizeText: {
    color: "#10B981",
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#09090B",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F4F4F5",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#27272A",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#27272A",
  },
  cancelBtnText: {
    color: "#D4D4D8",
    fontWeight: "600",
    fontSize: 14,
  },
  uploadBtn: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#9333EA",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
