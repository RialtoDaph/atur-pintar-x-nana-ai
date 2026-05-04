/**
 * Nana sometimes outputs raw JSON like:
 *   {"content": "...", "interactive_prompt": {...}}
 * Either as the entire message or wrapped in a ```json ... ``` code fence.
 * This helper extracts the displayable text + interactive_prompt object so the UI
 * can render proper buttons instead of dumping raw JSON in the chat bubble.
 *
 * Returns { text, interactivePrompt }.
 */
export function parseNanaMessage(content) {
  if (!content || typeof content !== "string") {
    return { text: content || "", interactivePrompt: null };
  }

  // Try to find a JSON object that contains "interactive_prompt".
  // Accept either a fenced ```json ... ``` block or a bare {...} blob.
  const fenced = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  const candidate = fenced ? fenced[1] : extractFirstJsonObject(content);

  if (!candidate) return { text: content, interactivePrompt: null };

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && parsed.interactive_prompt) {
      const before = content.slice(0, content.indexOf(candidate)).trim();
      const after = content.slice(content.indexOf(candidate) + candidate.length).trim();
      // Strip leftover code-fence markers
      const cleanBefore = before.replace(/```(?:json)?\s*$/, "").trim();
      const cleanAfter = after.replace(/^```/, "").trim();
      const text = [cleanBefore, parsed.content || "", cleanAfter].filter(Boolean).join("\n\n").trim();
      return { text, interactivePrompt: parsed.interactive_prompt };
    }
  } catch {
    // not valid JSON — fall through
  }

  return { text: content, interactivePrompt: null };
}

// Find the first balanced {...} substring containing "interactive_prompt"
function extractFirstJsonObject(text) {
  const startIdx = text.indexOf("{");
  if (startIdx === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(startIdx, i + 1);
        if (candidate.includes("interactive_prompt")) return candidate;
        return null;
      }
    }
  }
  return null;
}