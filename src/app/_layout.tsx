import { Stack } from "expo-router";
import { View, StyleSheet, StatusBar } from "react-native";
import { AudioProvider } from "../context/AudioContext";
import { BottomPlayer } from "../components/BottomPlayer";

export default function RootLayout() {
  return (
    <AudioProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#09090B" },
            headerTintColor: "#F4F4F5",
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: "#09090B" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "My Music Hub", headerShown: false }} />
          <Stack.Screen name="songs" options={{ title: "All Songs", headerBackTitle: "Back" }} />
        </Stack>
        <BottomPlayer />
      </View>
    </AudioProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
});
