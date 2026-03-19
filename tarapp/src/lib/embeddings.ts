import { ExecutorchEmbeddings } from 'react-native-rag';

const MODEL_ASSET = require('../../assets/models/all-MiniLM-L6-v2_xnnpack.pte');

let embeddingsInstance: ExecutorchEmbeddings | null = null;

export async function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new ExecutorchEmbeddings({
      modelAsset: MODEL_ASSET,
    });
  }
  return embeddingsInstance;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const engine = await getEmbeddings();
  return engine.embedQuery(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const engine = await getEmbeddings();
  return engine.embedDocuments(texts);
}
