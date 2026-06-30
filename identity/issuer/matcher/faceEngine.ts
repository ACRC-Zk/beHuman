// Motor de caras (testnet): detección, embeddings y landmarks con face-api + tfjs-node.
//
// ⚠️ Solo para testnet/prototipo (lo dice Proveedores-y-Stack). El liveness robusto y
// certificado (iBeta ISO 30107-3) y el match contra foto oficial van por RENAPER en prod.
//
// Privacidad: trabaja sobre buffers en memoria; nunca persiste ni loguea imágenes;
// devuelve solo descriptores/landmarks para uso interno del gate (no salen del backend).
import * as tf from "@tensorflow/tfjs-node";
import * as faceapi from "@vladmandic/face-api";
import sharp from "sharp";

let loaded = false;

// Las fotos de celular (DNI/selfie) pueden ser de varios megapíxeles; decodificarlas a
// resolución completa dispara la memoria (un tensor de 4000x3000x3 ≈ 140MB) y mata el
// proceso por OOM en instancias chicas. Reducimos a un lado máximo razonable ANTES de
// decodificar/OCR: la detección de caras y el OCR no necesitan más que ~1280px.
const MAX_DIM = Number(process.env.IMAGE_MAX_DIM) > 0 ? Number(process.env.IMAGE_MAX_DIM) : 1280;

/**
 * Reescala (manteniendo aspecto, sin agrandar) y normaliza orientación EXIF. Idempotente.
 * `maxDim` permite usar más resolución para la pasada de OCR (lee mejor el nº del DNI) que
 * para la detección de caras, sin volver a OOM en instancias chicas si se baja por env.
 */
export async function fitImage(image: Buffer, maxDim: number = MAX_DIM): Promise<Buffer> {
  try {
    return await sharp(image)
      .rotate() // respeta la orientación EXIF (fotos de celular)
      .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
      .toBuffer();
  } catch {
    return image; // si sharp falla, seguimos con el original (mejor que romper el flujo)
  }
}

/** Carga los pesos de los modelos desde disco. Idempotente. */
export async function loadModels(modelsPath: string): Promise<void> {
  if (loaded) return;
  await tf.ready();
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
  loaded = true;
}

export interface FaceData {
  descriptor: Float32Array; // embedding 128-d
  landmarks: faceapi.FaceLandmarks68;
  detectionScore: number;
}

/**
 * Detecta UNA cara en la imagen y devuelve su embedding + landmarks.
 * `null` si no hay cara detectable.
 */
export async function detectFace(
  image: Buffer,
  minConfidence = 0.5,
): Promise<FaceData | null> {
  const tensor = tf.node.decodeImage(await fitImage(image), 3) as unknown as tf.Tensor3D;
  try {
    const result = await faceapi
      .detectSingleFace(tensor as never, new faceapi.SsdMobilenetv1Options({ minConfidence }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!result) return null;
    return {
      descriptor: result.descriptor,
      landmarks: result.landmarks,
      detectionScore: result.detection.score,
    };
  } finally {
    tensor.dispose();
  }
}

/**
 * Distancia euclidiana entre dos embeddings (face-api estándar). MENOR = más
 * parecidos; el umbral típico de match 1:1 es 0.6. (El coseno NO sirve para estos
 * descriptores: caras distintas dan coseno ~0.85+.)
 */
export function faceDistance(a: Float32Array, b: Float32Array): number {
  return faceapi.euclideanDistance(a, b);
}
