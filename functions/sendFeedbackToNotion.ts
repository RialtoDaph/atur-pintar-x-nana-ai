import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const NOTION_DATABASE_ID = "328cdc1062bc8054a582d6cd777e3f63";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("notion");

    const { rating, message, userName, userEmail } = payload;

    // Map rating to priority
    let priority = "MEDIUM";
    if (rating >= 4) priority = "LOW";
    else if (rating <= 2) priority = "HIGH";

    const userLabel = userName ? `${userName}${userEmail ? ` (${userEmail})` : ""}` : (userEmail || "Anonymous");
    const feedbackContent = `${rating ? `⭐ Rating: ${rating}/5\n\n` : ""}${message}`;

    const body = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        User: {
          title: [{ text: { content: userLabel } }]
        },
        Feedback: {
          rich_text: [{ text: { content: feedbackContent } }]
        },
        Status: {
          select: { name: "New" }
        },
        Priority: {
          select: { name: priority }
        },
        Type: {
          select: { name: "Feature request" }
        }
      }
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});