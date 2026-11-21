import {LibSQLStore} from "@mastra/libsql";
import {Memory} from "@mastra/memory";
import {resolve} from "node:path";

const dbPath = resolve(process.cwd(), "mastra.db");

/** Stores agent memory in a local LibSQL database for this backend process. */
export const memoryStore = new LibSQLStore({
    id: "meeting-assistant-memory",
    url: `file:${dbPath}`,
});

/**
 * Creates the agent's conversation memory.
 *
 * The `options` object passed to `Memory` controls how remembered context is
 * retained and which working-memory data is enabled:
 *
 * - `lastMessages`: Maximum number of recent conversation messages retained
 *   in the Memory context.
 * - `workingMemory`: Configures persistent data the agent can maintain across
 *   conversations.
 *   - `enabled`: Turns working-memory support on or off.
 *   - `scope`: Defines who owns the saved memory. `"resource"` keeps the
 *     preferences for a resource, such as a calendar user.
 *   - `template`: Markdown structure that tells the agent which preference
 *     fields to fill and preserve.
 *
 * The `storage` property supplies the LibSQL store used for persisted memory.
 */
export function createAgentMemory() {
    return new Memory({
        storage: memoryStore,
        options: {
            lastMessages: 20,
            workingMemory: {
                enabled: true,
                scope: "resource",
                template: `# Meeting Preferences
                - Timezone:
                - Default meeting length (minutes):
                - Preferred meeting hours:
                - Usual invitees:
                - Notes:`,
            }
        },
    });
}