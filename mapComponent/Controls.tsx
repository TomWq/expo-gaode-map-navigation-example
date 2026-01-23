
import { ExpoGaodeMapModule, MapViewRef } from 'expo-gaode-map-navigation';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function Controls({ mapRef }: { mapRef: React.RefObject<MapViewRef | null> }) {
  return (
    <View style={styles.panel}>
      <Pressable
        style={styles.btn}
        onPress={async () => {
          const loc = await ExpoGaodeMapModule.getCurrentLocation();
          mapRef.current?.moveCamera({
            target: loc,
            zoom: 15,
          });
        }}
      >
        <Text style={styles.text}>定位</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
  },
});
