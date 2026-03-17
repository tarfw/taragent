import { Hono } from 'hono';
import { z } from 'zod';
import { InterpreterAgent } from './agents/interpreter';
import { getDbClient } from './db/client';

type Bindings = {
  TURSO_DB_URL: string;
  TURSO_DB_TOKEN: string;
  TASK_DO: DurableObjectNamespace;
  ORDER_DO: DurableObjectNamespace;
  CONVERSATION_DO: DurableObjectNamespace;
  SESSION_DO: DurableObjectNamespace;
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

// Zod schema for incoming channel requests (e.g. from Telegram/App)
const ChannelRequestSchema = z.object({
  channel: z.string(),     // e.g. "telegram", "app"
  userId: z.string(),      // e.g. telegram user ID
  scope: z.string(),       // e.g. "shop:ramstore"
  text: z.string().optional(), // The user's input/intent (optional if action is provided)
  action: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]).optional(), // Structured CRUD
  data: z.record(z.any()).optional(), // Structured payload for protocol
  lat: z.number().optional(),
  lng: z.number().optional()
}).refine(data => data.text || data.action, {
  message: "Either 'text' or 'action' must be provided"
});

app.post('/api/channel', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request using Zod
    const parsedData = ChannelRequestSchema.safeParse(body);
    if (!parsedData.success) {
      return c.json({ error: "Invalid request payload", details: parsedData.error.errors }, 400);
    }

    const requestData = parsedData.data;
    
    // Initialize DB connection for this request
    const db = getDbClient(c.env.TURSO_DB_URL, c.env.TURSO_DB_TOKEN);
    
    // Run the Interpreter Agent
    const interpreter = new InterpreterAgent(db, c.env);
    const result = await interpreter.processIntent(requestData);

    return c.json({ success: true, result });
  } catch (err: any) {
    console.error("Gateway Error:", err);
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  }
});

export default app;

// Export Durable Objects so Wrangler can bind them
export { OrderDO } from './do/order';
export { TaskDO } from './do/task';
export { ConversationDO, SessionDO } from './do/stubs';
