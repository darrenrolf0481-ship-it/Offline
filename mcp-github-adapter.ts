import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

let _githubClient: Client | null = null;

export async function getGithubMcpClient(token?: string): Promise<Client> {
    if (_githubClient) {
        return _githubClient;
    }

    const tkn = token || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    if (!tkn) {
        throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN is required to connect to GitHub MCP");
    }

    const transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: tkn }
    });

    const client = new Client(
        { name: "serena-hub", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    _githubClient = client;
    return client;
}

export async function loadGithubMcpTools(token?: string) {
    try {
        const client = await getGithubMcpClient(token);
        const toolsResponse = await client.listTools();
        
        return toolsResponse.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            handler: async (args: any) => {
                const result = await client.callTool({
                    name: tool.name,
                    arguments: args
                });
                return result;
            }
        }));
    } catch (err) {
        console.error("Failed to load GitHub MCP Tools:", err);
        return [];
    }
}
