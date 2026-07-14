import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { productCategories, statusLabels } from "../constants/options";
import { digitsOnly, formatDateTime, stripDigits } from "../utils/format";
import { PhotoPicker, PhotoStrip } from "./Photos";
import { JobStatusTrail } from "./JobStatusTrail";
import { Badge, Card, Input, PrimaryButton, SegmentedControl, SmallButton } from "./ui";

const portalViews = [
  { value: "create", label: "Talep Aç" },
  { value: "track", label: "Talep Takip" }
];

export function CustomerPortal({
  requestForm,
  setRequestForm,
  trackingForm,
  setTrackingForm,
  result,
  busy,
  onCreate,
  onTrack,
  onOpenPhoto,
  onShare
}) {
  const [activeView, setActiveView] = useState(result ? "track" : "create");

  useEffect(() => {
    if (result?.requestCode) {
      setActiveView("track");
    }
  }, [result?.requestCode]);

  const normalizedTrackingCode = String(trackingForm.requestCode || "").trim().toUpperCase();
  const resultMatchesForm = Boolean(result && result.requestCode === normalizedTrackingCode);

  return (
    <View style={styles.stack}>
      <SegmentedControl items={portalViews} value={activeView} onChange={setActiveView} />
      {activeView === "create" ? (
        <RequestForm
          form={requestForm}
          setForm={setRequestForm}
          busy={busy}
          onSubmit={onCreate}
        />
      ) : (
        <View style={styles.stack}>
          {resultMatchesForm ? (
            <PublicRequestResult
              result={result}
              busy={busy}
              onRefresh={onTrack}
              onOpenPhoto={onOpenPhoto}
              onShare={onShare}
            />
          ) : null}
          <TrackingForm
            form={trackingForm}
            setForm={setTrackingForm}
            busy={busy}
            hasResult={resultMatchesForm}
            onSubmit={onTrack}
          />
        </View>
      )}
    </View>
  );
}

function RequestForm({ form, setForm, busy, onSubmit }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>Arıza Talebi Aç</Text>
      <Input
        label="Ad Soyad"
        value={form.name}
        onChangeText={(value) => setForm({ ...form, name: stripDigits(value) })}
        placeholder="Ahmet Yılmaz"
        autoCapitalize="words"
        textContentType="name"
        returnKeyType="next"
        maxLength={80}
      />
      <Input
        label="Telefon"
        value={form.phone}
        onChangeText={(value) => setForm({ ...form, phone: digitsOnly(value) })}
        placeholder="05551234567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        maxLength={11}
        returnKeyType="next"
      />
      <Input
        label="Adres"
        value={form.address}
        onChangeText={(value) => setForm({ ...form, address: value })}
        placeholder="Mahalle, sokak, ilçe"
        autoCapitalize="words"
        textContentType="fullStreetAddress"
        returnKeyType="next"
        maxLength={250}
      />
      <Text style={styles.label}>Ürün</Text>
      <SegmentedControl
        items={productCategories}
        value={form.productCategory}
        onChange={(value) => setForm({ ...form, productCategory: value })}
      />
      <View style={styles.fieldGroup}>
        <Input
          label="Marka"
          value={form.productBrand}
          onChangeText={(value) => setForm({ ...form, productBrand: value })}
          placeholder="Arçelik"
          autoCapitalize="words"
          returnKeyType="next"
          maxLength={80}
        />
        <Input
          label="Model"
          value={form.productModel}
          onChangeText={(value) => setForm({ ...form, productModel: value })}
          placeholder="Opsiyonel"
          autoCapitalize="characters"
          returnKeyType="next"
          maxLength={80}
        />
      </View>
      <Input
        label="Arıza Açıklaması"
        value={form.description}
        onChangeText={(value) => setForm({ ...form, description: value })}
        placeholder="Sorunu kısaca anlat"
        multiline
        maxLength={2000}
      />
      <PhotoPicker photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
      <PrimaryButton title={busy ? "Gönderiliyor..." : "Talep Oluştur"} onPress={onSubmit} disabled={busy} />
    </Card>
  );
}

function TrackingForm({ form, setForm, busy, hasResult, onSubmit }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{hasResult ? "Başka Talep Bul" : "Talep Takibi"}</Text>
      <Input
        label="Takip Kodu"
        value={form.requestCode}
        onChangeText={(value) => setForm({ ...form, requestCode: value.toUpperCase() })}
        placeholder="SD-123456"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={32}
        returnKeyType="next"
      />
      <Input
        label="Telefon"
        value={form.phone}
        onChangeText={(value) => setForm({ ...form, phone: digitsOnly(value) })}
        placeholder="05551234567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        maxLength={11}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      <PrimaryButton title={busy ? "Kontrol ediliyor..." : "Durumu Göster"} onPress={onSubmit} disabled={busy} />
    </Card>
  );
}

function PublicRequestResult({ result, busy, onRefresh, onOpenPhoto, onShare }) {
  const productLine = [result.productCategoryLabel, result.productBrand, result.productModel].filter(Boolean).join(" - ");
  const history = Array.isArray(result.statusHistory) ? result.statusHistory : [];
  const appointment = formatDateTime(result.appointmentAt);

  return (
    <Card accent={result.status === "cancelled" ? "#dc2626" : "#0f766e"}>
      <View style={styles.rowBetween}>
        <View style={styles.resultCopy}>
          <Text style={styles.muted}>Takip Kodu</Text>
          <Text style={styles.resultCode} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {result.requestCode}
          </Text>
        </View>
        <Badge text={statusLabels[result.status] || result.status} danger={result.status === "cancelled"} />
      </View>
      <JobStatusTrail status={result.status} />
      <Text style={styles.bodyText}>{result.title || "Servis talebi"}</Text>
      {productLine ? <Text style={styles.muted}>{productLine}</Text> : null}
      <PhotoStrip photos={result.photos} onOpenPhoto={onOpenPhoto} />
      <Text style={styles.muted}>
        {appointment ? "Randevu: " + appointment : "Randevu bilgisi usta tarafından eklenecek."}
      </Text>
      <View style={styles.historyBox}>
        <Text style={styles.historyTitle}>Talep geçmişi</Text>
        {history.length > 0 ? (
          history.map((event) => (
            <View key={event.id || event.createdAt || event.status} style={styles.historyItem}>
              <Text style={styles.historyStatus}>{statusLabels[event.status] || event.status}</Text>
              <Text style={styles.historyMeta}>{formatDateTime(event.createdAt) || "Tarih yok"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.historyMeta}>İlk kayıt oluşturuldu.</Text>
        )}
      </View>
      <View style={styles.actionRow}>
        <SmallButton title="Kodu Paylaş" onPress={() => onShare?.(result)} />
        <SmallButton title={busy ? "Güncelleniyor..." : "Durumu Yenile"} onPress={onRefresh} disabled={busy} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12
  },
  cardTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900"
  },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900"
  },
  fieldGroup: {
    gap: 10
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  resultCopy: {
    flex: 1,
    minWidth: 0
  },
  resultCode: {
    color: "#0f766e",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0
  },
  bodyText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700"
  },
  muted: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700"
  },
  historyBox: {
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  historyTitle: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900"
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  historyStatus: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900"
  },
  historyMeta: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
