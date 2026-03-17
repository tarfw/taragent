import { Client } from '@libsql/client';

export class SearchAgent {
  private db: Client;
  private env: any; // For AI bindings, e.g. text-embeddings

  constructor(db: Client, env: any) {
    this.db = db;
    this.env = env;
  }

  /**
   * Performs a semantic search against the Turso state table.
   * Note: This requires Turso's vector search capabilities and an embedding model.
   */
  async searchProduct(query: string, limit: number = 5) {
    // 1. Generate an embedding for the search query
    console.log(`Searching for: ${query}`);
    
    let queryEmbedding: number[] = [];
    if (this.env.AI) {
      const response = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
      queryEmbedding = response.data[0];
    } else {
        console.warn("No AI binding found, returning mock search results.");
        return [{ ucode: "dummy-1", title: "Dummy Apple", score: 0.99 }];
    }

    // 2. Query Turso's state table using vector distance (requires vector extensions enabled in Turso)
    try {
        const result = await this.db.execute({
            // Assuming `embedding` column is configured for vector search in Turso
            // If using vector distance function like vector_distance_cos
            sql: `
              SELECT ucode, title, payload, type
              FROM state
              WHERE type = 'product'
              ORDER BY vector_distance_cos(embedding, vector(?)) ASC
              LIMIT ?
            `,
            args: [JSON.stringify(queryEmbedding), limit]
        });
        
        return result.rows;
    } catch (e: any) {
        console.error("Vector search failed (ensure Turso vector extensions are enabled):", e.message);
        throw e;
    }
  }
}
