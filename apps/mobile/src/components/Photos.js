import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import React from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

const MAX_MOBILE_PHOTOS = 3;
const MAX_MOBILE_PHOTO_DATA_URL_LENGTH = 950000;

export function normalizePhotoList(photos) {
  return Array.isArray(photos) ? photos.filter((photo) => photo?.dataUrl || photo?.uri) : [];
}

function getPhotoUri(photo) {
  return photo?.dataUrl || photo?.uri || "";
}

function createMobilePhoto(asset) {
  const mimeType = asset.mimeType || "image/jpeg";

  if (!asset.base64) {
    return { error: "Fotoğraf okunamadı." };
  }

  const dataUrl = "data:" + mimeType + ";base64," + asset.base64;

  if (dataUrl.length > MAX_MOBILE_PHOTO_DATA_URL_LENGTH) {
    return { error: "Fotoğraf çok büyük. Daha düşük boyutlu fotoğraf seç." };
  }

  return {
    value: {
      id: "photo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      uri: asset.uri,
      dataUrl,
      name: asset.fileName || "Fotoğraf",
      type: mimeType
    }
  };
}

function getResizeAction(asset, maxEdge) {
  const width = Number(asset.width || 0);
  const height = Number(asset.height || 0);

  if (!width || !height || Math.max(width, height) <= maxEdge) {
    return [];
  }

  return width >= height
    ? [{ resize: { width: maxEdge } }]
    : [{ resize: { height: maxEdge } }];
}

async function prepareMobilePhoto(asset) {
  const variants = [
    { maxEdge: 1600, compress: 0.58 },
    { maxEdge: 1280, compress: 0.46 },
    { maxEdge: 960, compress: 0.36 },
    { maxEdge: 720, compress: 0.3 }
  ];

  for (const variant of variants) {
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      getResizeAction(asset, variant.maxEdge),
      {
        base64: true,
        compress: variant.compress,
        format: ImageManipulator.SaveFormat.JPEG
      }
    );
    const photo = createMobilePhoto({
      ...result,
      fileName: asset.fileName || "Fotoğraf.jpg",
      mimeType: "image/jpeg"
    });

    if (!photo.error) {
      return photo;
    }
  }

  return { error: "Fotoğraf sıkıştırılamadı. Daha küçük bir fotoğraf seç." };
}

async function pickPhotos(currentPhotos, onChange) {
  const current = normalizePhotoList(currentPhotos);
  const remaining = MAX_MOBILE_PHOTOS - current.length;

  if (remaining <= 0) {
    Alert.alert("Sınır dolu", "En fazla 3 fotoğraf ekleyebilirsin.");
    return;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("İzin gerekli", "Fotoğraf seçmek için galeri izni vermelisin.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    base64: false,
    quality: 1
  });

  if (result.canceled) {
    return;
  }

  const nextPhotos = [...current];

  for (const asset of result.assets || []) {
    const photo = await prepareMobilePhoto(asset);
    if (photo.error) {
      Alert.alert("Fotoğraf eklenemedi", photo.error);
      continue;
    }
    nextPhotos.push(photo.value);
  }

  onChange(nextPhotos.slice(0, MAX_MOBILE_PHOTOS));
}

async function takePhoto(currentPhotos, onChange) {
  const current = normalizePhotoList(currentPhotos);

  if (current.length >= MAX_MOBILE_PHOTOS) {
    Alert.alert("Sınır dolu", "En fazla 3 fotoğraf ekleyebilirsin.");
    return;
  }

  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("İzin gerekli", "Fotoğraf çekmek için kamera izni vermelisin.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: false,
    quality: 1
  });

  if (result.canceled || !result.assets?.[0]) {
    return;
  }

  const photo = await prepareMobilePhoto(result.assets[0]);

  if (photo.error) {
    Alert.alert("Fotoğraf eklenemedi", photo.error);
    return;
  }

  onChange([...current, photo.value].slice(0, MAX_MOBILE_PHOTOS));
}

function PhotoButton({ title, onPress, disabled }) {
  return (
    <Pressable style={[styles.smallButton, disabled && styles.disabledAction]} onPress={onPress} disabled={disabled}>
      <Text style={styles.smallButtonText}>{title}</Text>
    </Pressable>
  );
}

export function PhotoPicker({ photos, onChange }) {
  const items = normalizePhotoList(photos);
  const [busy, setBusy] = React.useState(false);

  async function runPhotoAction(action) {
    if (busy) {
      return;
    }

    try {
      setBusy(true);
      await action();
    } catch {
      Alert.alert("Fotoğraf eklenemedi", "Fotoğraf hazırlanırken bir hata oluştu. Tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.photoPicker}>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Fotoğraflar</Text>
        <Text style={styles.muted}>{items.length}/3</Text>
      </View>
      {items.length > 0 ? (
        <View style={styles.photoGrid}>
          {items.map((photo) => (
            <View key={photo.id || getPhotoUri(photo)} style={styles.photoTile}>
              <Image source={{ uri: getPhotoUri(photo) }} style={styles.photoImage} />
              <Pressable
                style={[styles.photoRemove, busy && styles.disabledAction]}
                onPress={() => onChange(items.filter((item) => item !== photo))}
                disabled={busy}
              >
                <Text style={styles.photoRemoveText}>Sil</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>Arızayı gösteren fotoğraf ekleyebilirsin.</Text>
      )}
      {busy ? <Text style={styles.muted}>Fotoğraf hazırlanıyor...</Text> : null}
      <View style={styles.actionRow}>
        <PhotoButton
          title="Galeriden Seç"
          onPress={() => runPhotoAction(() => pickPhotos(items, onChange))}
          disabled={busy || items.length >= MAX_MOBILE_PHOTOS}
        />
        <PhotoButton
          title="Kamera"
          onPress={() => runPhotoAction(() => takePhoto(items, onChange))}
          disabled={busy || items.length >= MAX_MOBILE_PHOTOS}
        />
      </View>
    </View>
  );
}

export function PhotoStrip({ photos, onOpenPhoto }) {
  const items = normalizePhotoList(photos);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.photoStrip}>
      {items.map((photo) => (
        <Pressable
          key={photo.id || getPhotoUri(photo)}
          style={styles.photoStripButton}
          onPress={() => onOpenPhoto?.(photo)}
          disabled={!onOpenPhoto}
        >
          <Image source={{ uri: getPhotoUri(photo) }} style={styles.photoStripImage} />
        </Pressable>
      ))}
    </View>
  );
}

export function PhotoPreviewModal({ photo, onClose }) {
  const uri = getPhotoUri(photo);

  return (
    <Modal visible={Boolean(uri)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.photoModal}>
        <Pressable style={styles.photoModalBackdrop} onPress={onClose} />
        <View style={styles.photoModalContent}>
          {uri ? <Image source={{ uri }} style={styles.photoModalImage} resizeMode="contain" /> : null}
          <Text style={styles.photoModalTitle}>{photo?.name || "Fotoğraf"}</Text>
          <Pressable style={styles.photoModalClose} onPress={onClose}>
            <Text style={styles.photoModalCloseText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900"
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  disabledAction: {
    opacity: 0.5
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  smallButtonText: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "900"
  },
  photoPicker: {
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc"
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  photoTile: {
    width: 92,
    height: 92,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e2e8f0"
  },
  photoImage: {
    width: "100%",
    height: "100%"
  },
  photoRemove: {
    position: "absolute",
    right: 5,
    bottom: 5,
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.78)"
  },
  photoRemoveText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  photoStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  photoStripButton: {
    borderRadius: 8,
    overflow: "hidden"
  },
  photoStripImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#e2e8f0"
  },
  photoModal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "rgba(15,23,42,0.88)"
  },
  photoModalBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  photoModalContent: {
    width: "100%",
    maxHeight: "88%",
    gap: 12,
    alignItems: "center"
  },
  photoModalImage: {
    width: "100%",
    height: 460,
    borderRadius: 8,
    backgroundColor: "#020617"
  },
  photoModalTitle: {
    color: "#ffffff",
    fontWeight: "900"
  },
  photoModalClose: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ccfbf1"
  },
  photoModalCloseText: {
    color: "#0f766e",
    fontWeight: "900"
  }
});
