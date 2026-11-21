import assert from "node:assert/strict";
import { test } from "node:test";
import { getAgentInstructions } from "./agent-instructions.js";

/** Verifies the system prompt includes examples and explicit safety boundaries. */
function testPromptIncludesExamplesAndForbiddenActions() {
  const instructions = getAgentInstructions();

  assert.match(instructions, /Few-shot examples:/);
  assert.match(instructions, /Forbidden actions:/);
  assert.match(instructions, /Never claim that an event was created/);
  assert.match(instructions, /Never reveal, request, or include session tokens/);
}

test(
  "agent instructions include few-shot examples and forbidden actions",
  testPromptIncludesExamplesAndForbiddenActions,
);
