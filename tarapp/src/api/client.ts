export const API_BASE_URL = "https://taragent.wetarteam.workers.dev/api/channel";

export interface CreateStateRequest {
  channel: string;
  userId: string;
  scope: string;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE";
  data: {
    ucode: string;
    title?: string;
    payload?: any;
  };
}

export async function sendCommerceAction(req: CreateStateRequest) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Commerce API Error:", error);
    throw error;
  }
}
