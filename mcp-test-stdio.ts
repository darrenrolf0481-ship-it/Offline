import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  console.log('Connecting to local GitHub MCP...');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: 'dummy' },
  });

  const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log('Connected!');
    const tools = await client.listTools();
    console.log('Tools:', tools.tools.map((t) => t.name).join(', '));
    await client.close();
  } catch (err) {
    console.error(err);
  }
}

main();
