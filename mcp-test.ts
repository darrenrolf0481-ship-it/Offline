import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import fetch from "node-fetch";

async function main() {
  console.log("Connecting to GitHub MCP...");
  const transport = new SSEClientTransport(
    new URL("https://api.githubcopilot.com/mcp/"),
    {
      requestInit: {
        headers: {
          "Authorization": `Bearer ${process.env.GITHUB_TOKEN ?? ""}`
        }
      }
    }
  );
  
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
      await client.connect(transport);
      console.log("Connected!");
      const tools = await client.listTools();
      console.log(tools);
      client.close();
  } catch (err) {
      console.error(err);
  }
}

main();
