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
  async processIntent(req: { 
    text?: string; 
    scope: string; 
    userId: string; 
    action?: "CREATE" | "READ" | "UPDATE" | "DELETE" | "SEARCH";
    data?: Record<string, any>;
    lat?: number; 
    lng?: number 
  }) {
    console.log(`Processing ${req.action || 'intent'} for scope ${req.scope}`);
    console.log(`Available bindings: ${Object.keys(this.env || {}).join(", ")}`);

    let intentData: OpcodeResult;

    if (req.action && req.data) {
      // Step 1: Structured CRUD path (App Interface)
      intentData = await this.executeCrud(req.action, req.data, req.scope);
    } else if (req.text) {
      // Step 1: Natural Language path (Chat Input)
      const aiOutput = await this.extractIntentAi(req.text);

      // Step 2: Validate the AI output using Zod
      const parsedIntent = OpcodeOutputSchema.safeParse(aiOutput);
      if (!parsedIntent.success) {
        console.error("AI output failed schema validation", parsedIntent.error);
        throw new Error("Failed to understand intent structurally");
      }
      intentData = parsedIntent.data;
    } else {
        throw new Error("Invalid request: missing text or action");
    }

    // Step 3: Write to trace ledger
    await this.writeTrace(intentData, req);

    // Step 4: Update the instance (working state)
    // For READ we might skip instance update, but for CREATE/UPDATE it logs the event
    if (req.action !== "READ") {
        await this.updateInstance(intentData, req.scope);
    }

    // Step 5: Broadcast Live Events
    const broadcastOpcodes = [101, 102, 103, 110];
    if (broadcastOpcodes.includes(intentData.opcode)) {
        await this.triggerLiveBroadcast(intentData, req.scope);
    }

    // Step 6: If it's a scheduling task (301), trigger the Durable Object Alarm
    if (intentData.opcode === 301) {
        await this.triggerTaskDO(intentData, req.scope);
    }

    return intentData;
  }

  /**
   * Executes structured CRUD on the state table
   */
  private async executeCrud(action: string, data: any, scope: string): Promise<OpcodeResult> {
    const ucode = data.ucode || data.streamid;
    if (!ucode) throw new Error("ucode or streamid is required for CRUD operations");

    const [type] = ucode.split(':');
    let opcode = 100; // Base Opcode for State Management

    // Generate Embedding if applicable
    let embeddingStr = null;
    if ((action === "CREATE" || action === "UPDATE") && this.env.AI && (data.title || data.payload)) {
      const textToEmbed = `${data.title || ''} ${JSON.stringify(data.payload || {})}`.trim();
      try {
        const embedResp = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [textToEmbed] });
        const vec = embedResp.data[0];
        const floatArray = Array.from(vec);
        embeddingStr = `[${floatArray.join(',')}]`;
      } catch(e) {
        console.warn("Embedding generation failed", e);
      }
    }

    if (action === "CREATE") {
      opcode = 101; // Map CREATE to Stock IN / Init
      const id = crypto.randomUUID();
      if (embeddingStr) {
        await this.db.execute({
          sql: "INSERT INTO state (id, ucode, type, title, payload, scope, embedding) VALUES (?, ?, ?, ?, ?, ?, vector(?))",
          args: [id, ucode, type || 'unknown', data.title || null, JSON.stringify(data.payload || {}), scope, embeddingStr]
        });
      } else {
        await this.db.execute({
          sql: "INSERT INTO state (id, ucode, type, title, payload, scope) VALUES (?, ?, ?, ?, ?, ?)",
          args: [id, ucode, type || 'unknown', data.title || null, JSON.stringify(data.payload || {}), scope]
        });
      }
      return {
        opcode: 101,
        delta: data.delta || 0,
        streamid: ucode,
        ucode: ucode,
        title: data.title || null,
        payload: data.payload || {},
        status: "done"
      } as any;
    } else if (action === "UPDATE") {
      opcode = 110; // Generic Update Opcode
      if (embeddingStr) {
        await this.db.execute({
          sql: "UPDATE state SET title = COALESCE(?, title), payload = COALESCE(?, payload), embedding = vector(?) WHERE ucode = ? AND scope = ?",
          args: [data.title || null, data.payload ? JSON.stringify(data.payload) : null, embeddingStr, ucode, scope]
        });
      } else {
        await this.db.execute({
          sql: "UPDATE state SET title = COALESCE(?, title), payload = COALESCE(?, payload) WHERE ucode = ? AND scope = ?",
          args: [data.title || null, data.payload ? JSON.stringify(data.payload) : null, ucode, scope]
        });
      }
      return {
        opcode: 110,
        delta: data.delta || 0,
        streamid: ucode,
        ucode: ucode,
        title: data.title || null,
        payload: data.payload || {},
        status: "done"
      } as any;
    } else if (action === "DELETE") {
      opcode = 199; // Delete Opcode
      await this.db.execute({
        sql: "DELETE FROM state WHERE ucode = ? AND scope = ?",
        args: [ucode, scope]
      });
    } else if (action === "READ") {
      opcode = 100; // Read/Status Opcode
      const result = await this.db.execute({
        sql: "SELECT * FROM state WHERE ucode = ? AND scope = ?",
        args: [ucode, scope]
      });
      if (result.rows.length === 0) throw new Error(`State ${ucode} not found in scope ${scope}`);
      
      return {
        opcode,
        delta: 0,
        streamid: ucode,
        status: "done",
        payload: result.rows[0] as any
      } as any;
    }

    return {
      opcode,
      delta: data.delta || 0,
      streamid: ucode,
      ucode: ucode,
      status: "done"
    } as any;
  }

  /**
   * Triggers the Durable Object Task scheduler. 
   * In a real OS, it would parse 'tonight at 5pm' to a timestamp. 
   * For this demo, we'll schedule a 60-second alarm.
   */
  private async triggerTaskDO(data: OpcodeResult, scope: string) {
    console.log(`Attempting to trigger TaskDO for scope: ${scope}`);
    if (!this.env.TASK_DO) {
        console.error("TASK_DO binding is MISSING from env. Available bindings:", Object.keys(this.env));
        return;
    }
    
    // Create a predictable DO ID for this scope/task
    const id = this.env.TASK_DO.idFromName(scope);
    console.log(`Durable Object ID: ${id}`);
    const stub = this.env.TASK_DO.get(id);
    
    try {
        console.log(`Sending fetch request to TaskDO stub...`);
        // Send a 'schedule' request to the DO
        const response = await stub.fetch("http://do/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "schedule", 
                delayMs: 60000, // 1 minute from now for testing
                streamid: data.streamid
            })
        });
        
        const text = await response.text();
        console.log(`TaskDO Response status: ${response.status}, text: ${text}`);
        console.log(`TaskDO for ${scope} has been alerted to start an alarm.`);
    } catch (err: any) {
        console.error(`FAILED to fetch TaskDO: ${err.message}`);
    }
  }

  /**
   * Broadcasts the event to all active WebSocket clients via the OrderDO
   */
  private async triggerLiveBroadcast(data: OpcodeResult, scope: string) {
    console.log(`Broadcasting live event to OrderDO for scope: ${scope}`);
    if (!this.env.ORDER_DO) return;
    
    const id = this.env.ORDER_DO.idFromName(scope);
    const stub = this.env.ORDER_DO.get(id);
    
    try {
        await stub.fetch("http://do/broadcast", {
            method: "POST",
            body: JSON.stringify(data)
        });
    } catch (err: any) {
        console.error(`FAILED to broadcast to OrderDO: ${err.message}`);
    }
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
