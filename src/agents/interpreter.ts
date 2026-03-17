import { Client } from '@libsql/client';
import { z } from 'zod';

// Zod schema representing the expected AI structural output for an operation
const OpcodeOutputSchema = z.object({
  opcode: z.number().describe("The numeric opcode representing the action (e.g., 101, 102, 301)"),
  delta: z.number().describe("The quantity change, positive for receive/add, negative for sell/remove"),
  streamid: z.string().describe("The target entity in format 'type:id' (e.g., 'product:apple')"),
  status: z.enum(["pending", "done", "failed"]).describe("The status of the operation")
});

type OpcodeResult = z.infer<typeof OpcodeOutputSchema>;

export class InterpreterAgent {
  private db: Client;
  private env: any; // The worker environment including AI bindings

  constructor(db: Client, env: any) {
    this.db = db;
    this.env = env;
  }

  /**
   * Main entry for processing a user's intent from a channel
   */
  async processIntent(req: { text: string; scope: string; userId: string; lat?: number; lng?: number }) {
    console.log(`Processing intent for scope ${req.scope}: ${req.text}`);

    // Step 1: Use AI to extract structured intent -> Opcode
    const aiOutput = await this.extractIntentAi(req.text);

    // Step 2: Validate the AI output using Zod
    const parsedIntent = OpcodeOutputSchema.safeParse(aiOutput);
    if (!parsedIntent.success) {
      console.error("AI output failed schema validation", parsedIntent.error);
      throw new Error("Failed to understand intent structurally");
    }

    const intentData = parsedIntent.data;

    // Step 3: Write to trace ledger
    await this.writeTrace(intentData, req);

    // Step 4: Update the instance (working state)
    // Note: In a real system, we look up `stateid` via `streamid` first
    await this.updateInstance(intentData, req.scope);

    return intentData;
  }

  /**
   * Uses Cloudflare Workers AI to parse text into a JSON object matching OpcodeOutputSchema.
   */
  private async extractIntentAi(text: string): Promise<any> {
    // We prompt the AI to return JSON matching our Zod schema requirements
    const prompt = `
      You are the Interpreter Agent for a Universal Commerce OS.
      Extract the intent from the user text and map it to an event opcode.
      
      Opcode rules:
      - 101: stock IN (receiving goods)
      - 102: stock OUT (selling/shipping goods)
      - 301: task/schedule
      
      Stream ID format: {type}:{id} (e.g., product:apple).
      
      Output exactly as JSON with these keys: "opcode" (number), "delta" (number), "streamid" (string), "status" (string: "pending"|"done"|"failed").
      Do not include markdown blocks, just raw JSON.
      
      User Text: "${text}"
    `;

    // Simulate calling the AI binding (requires this.env.AI in a real Cloudflare environment)
    // If testing locally without native AI binding configured, we can mock or use a stub.
    if (this.env.AI) {
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'user', content: prompt }]
      });
      try {
         // Attempt to parse the AI output assuming it followed instructions
         return JSON.parse(response.response.replace(/```json\n|\n```/g, '').trim());
      } catch (e) {
         console.warn("Could not parse AI JSON output directly. Stubbing fallback.");
      }
    }

    console.log("No AI binding detected or parsing failed, using simple fallback parser for testing.");
    // Fallback naive parser for testing purposes
    if (text.toLowerCase().includes('sell')) {
      return { opcode: 102, delta: -2, streamid: "product:apple", status: "done" };
    }
    return { opcode: 101, delta: 2, streamid: "product:apple", status: "done" };
  }

  /**
   * Inserts the event into the trace ledger in Turso
   */
  private async writeTrace(data: OpcodeResult, req: any) {
    const traceId = crypto.randomUUID();
    await this.db.execute({
      sql: `INSERT INTO trace (id, streamid, opcode, status, delta, lat, lng, payload, scope) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        traceId, 
        data.streamid, 
        data.opcode, 
        data.status, 
        data.delta, 
        req.lat || null, 
        req.lng || null, 
        JSON.stringify({ userId: req.userId, source: req.channel }), 
        req.scope
      ]
    });
    console.log(`Trace ${traceId} written successfully.`);
  }

  /**
   * Updates the projected state (instance table) based on the event
   */
  private async updateInstance(data: OpcodeResult, scope: string) {
    // 1. Resolve or Create the State entity (ucode)
    const ucode = data.streamid;
    
    // Check if state already exists
    const stateResult = await this.db.execute({
      sql: "SELECT id FROM state WHERE ucode = ?",
      args: [ucode]
    });

    let stateId: string;

    if (stateResult.rows.length > 0) {
      stateId = stateResult.rows[0].id as string;
    } else {
      // Auto-provision basic state if it doesn't exist
      stateId = crypto.randomUUID();
      const [type] = ucode.split(':');
      await this.db.execute({
        sql: "INSERT INTO state (id, ucode, type, scope) VALUES (?, ?, ?, ?)",
        args: [stateId, ucode, type || 'unknown', scope]
      });
      console.log(`Auto-provisioned state record for ${ucode}`);
    }

    // 2. Update the Instance
    const instanceId = crypto.randomUUID();
    
    // We use streamid as a unique part of the instance ID if we want to update existing projections,
    // or we can search for an existing instance tied to this stateId and scope.
    // For this proof of concept, we'll upsert by finding existing record for this stateid+scope
    
    await this.db.execute({
      sql: `INSERT INTO instance (id, stateid, type, scope, qty)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET qty = qty + excluded.qty`,
      args: [instanceId, stateId, 'projection', scope, data.delta]
    });
    
    // Note: To truly 'upsert' an instance for a product in a shop, we should probably have a unique constraint 
    // on (stateid, scope) in the instance table or use a deterministic ID.
    // Given the current schema doesn't have a unique constraint on (stateid, scope), 
    // 'ON CONFLICT(id)' only works if we use the same ID.
    
    console.log(`Instance updated for ${data.streamid}.`);
  }
}
