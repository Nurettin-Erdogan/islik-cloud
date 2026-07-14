const MAX_SOURCE_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PHOTO_DATA_URL_LENGTH = 950000;
const MAX_IMAGE_EDGE = 1600;
const MIN_IMAGE_EDGE = 480;
const IMAGE_FILE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|heic|heif)$/i;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Fotoğraf açılamadı."));
    image.src = dataUrl;
  });
}

function getTargetSize(width, height, maxEdge) {
  const longestEdge = Math.max(width, height);
  const scale = longestEdge > maxEdge ? maxEdge / longestEdge : 1;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function renderJpeg(canvas, context, image, width, height, quality) {
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressImageFile(file) {
  const mimeType = String(file.type || "").toLowerCase();
  const isImage = mimeType.startsWith("image/") || IMAGE_FILE_EXTENSION_PATTERN.test(file.name);

  if (!isImage || mimeType === "image/svg+xml") {
    throw new Error("Geçerli bir fotoğraf dosyası seç.");
  }

  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new Error("Fotoğraf 20 MB'dan küçük olmalı.");
  }

  const sourceUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Bu tarayıcı fotoğrafı işleyemiyor.");
  }

  let maxEdge = MAX_IMAGE_EDGE;
  let bestDataUrl = "";

  while (maxEdge >= MIN_IMAGE_EDGE) {
    const size = getTargetSize(image.naturalWidth, image.naturalHeight, maxEdge);

    for (const quality of [0.82, 0.7, 0.58, 0.46, 0.38]) {
      bestDataUrl = renderJpeg(
        canvas,
        context,
        image,
        size.width,
        size.height,
        quality
      );

      if (bestDataUrl.length <= MAX_PHOTO_DATA_URL_LENGTH) {
        return {
          id:
            globalThis.crypto?.randomUUID?.() ||
            `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name.slice(0, 80) || "Fotoğraf",
          type: "image/jpeg",
          dataUrl: bestDataUrl
        };
      }
    }

    maxEdge = Math.floor(maxEdge * 0.75);
  }

  throw new Error("Fotoğraf sıkıştırılamadı. Daha küçük bir fotoğraf seç.");
}
