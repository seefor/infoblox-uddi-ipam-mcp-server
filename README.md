# Infoblox BloxOne DDI IPAM MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-0.5.0-blue)](https://github.com/modelcontextprotocol/sdk)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides AI assistants with comprehensive access to Infoblox BloxOne DDI IP Address Management (IPAM) and DHCP services. This server enables seamless integration between AI tools and Infoblox infrastructure for automated network management tasks.

## Features

### Core IPAM Operations
- **IP Space Management** - Create, list, and manage IP spaces
- **Address Block Management** - Manage network address blocks with automatic allocation
- **Subnet Management** - Create and manage subnets with next available subnet discovery
- **IP Address Management** - Reserve, allocate, and track IP addresses
- **Range Management** - DHCP range configuration and management

### Advanced Network Services
- **DHCP Management** - Host configuration and fixed address reservations
- **Host Management** - IPAM host records and associations
- **DNS Usage Tracking** - Monitor and track DNS record usage
- **Utilization Statistics** - Network utilization monitoring and reporting
- **ASM Integration** - Automated Scope Management suggestions

### Built-in AI Prompts
- **Network Health Check** - Comprehensive network health reporting
- **Subnet Planning** - Intelligent subnet planning and allocation assistance

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Built-in Prompts](#built-in-prompts)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn** package manager
- **Infoblox BloxOne DDI** account with API access
- **API Key** with appropriate IPAM/DHCP permissions

## Installation

### Option 1: Install from npm (recommended)

```bash
npm install -g infoblox-uddi-ipam-mcp-server
```

### Option 2: Install from source

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/infoblox-uddi-ipam-mcp-server.git
   cd infoblox-uddi-ipam-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project (if using TypeScript):
   ```bash
   npm run build
   ```

### Option 3: Quick setup script

```bash
./setup.sh
```

## Configuration

### Environment Variables

Create a `.env` file in the project root or set the following environment variables:

```env
# Required: Your Infoblox API key
INFOBLOX_API_KEY=your_api_key_here

# Optional: Infoblox base URL (defaults to https://csp.infoblox.com)
INFOBLOX_BASE_URL=https://your-instance.infoblox.com
```

### MCP Client Configuration

To use this server with an MCP-compatible AI client (like Claude Desktop), add the following to your MCP configuration:

#### Claude Desktop Configuration

Claude Desktop is the primary MCP client for this server. Follow these detailed steps to connect:

##### Step 1: Install the Server

First, install the server globally:

```bash
# Option 1: Install from npm (when published)
npm install -g infoblox-uddi-ipam-mcp-server

# Option 2: Install from source
git clone https://github.com/your-org/infoblox-uddi-ipam-mcp-server.git
cd infoblox-uddi-ipam-mcp-server
npm install
npm run build
npm link  # Makes it globally available
```

##### Step 2: Locate Claude Desktop Configuration

Find your Claude Desktop configuration file:

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

##### Step 3: Configure the MCP Server

**Method 1: Using npm package (recommended)**

Add this configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "infoblox-uddi-ipam": {
      "command": "npx",
      "args": ["infoblox-uddi-ipam-mcp-server"],
      "env": {
        "INFOBLOX_API_KEY": "your_api_key_here",
        "INFOBLOX_BASE_URL": "https://your-instance.infoblox.com"
      }
    }
  }
}
```

**Method 2: Using local installation**

If you installed from source or want to use a local version:

```json
{
  "mcpServers": {
    "infoblox-uddi-ipam": {
      "command": "node",
      "args": ["/path/to/infoblox-uddi-ipam-mcp-server/src/index.ts"],
      "env": {
        "INFOBLOX_API_KEY": "your_api_key_here",
        "INFOBLOX_BASE_URL": "https://your-instance.infoblox.com"
      }
    }
  }
}
```

**Method 3: Using environment variables**

If you prefer to keep secrets out of the config file:

```json
{
  "mcpServers": {
    "infoblox-uddi-ipam": {
      "command": "npx",
      "args": ["infoblox-uddi-ipam-mcp-server"],
      "env": {}
    }
  }
}
```

Then set environment variables:

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export INFOBLOX_API_KEY="your_api_key_here"
export INFOBLOX_BASE_URL="https://your-instance.infoblox.com"
```

##### Step 4: Restart Claude Desktop

After saving the configuration file, completely restart Claude Desktop:

1. Quit Claude Desktop entirely
2. Wait a few seconds
3. Relaunch Claude Desktop

##### Step 5: Verify Connection

Once Claude Desktop restarts, you should see the Infoblox server connected. You can verify by:

1. **Check the MCP icon**: Look for an MCP server indicator in Claude Desktop
2. **Test with a simple command**: Ask Claude something like:
   ```
   "Can you list all IP spaces in our Infoblox system?"
   ```
3. **Check available tools**: Ask Claude:
   ```
   "What Infoblox tools do you have available?"
   ```

##### Troubleshooting Claude Desktop Connection

**Server Not Connecting:**
```bash
# Test the server manually
node /path/to/server/src/index.ts
# Should start without errors
```

**Invalid Configuration:**
```bash
# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
```

**Permission Issues:**
```bash
# Check file permissions
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
# Should be readable by your user
```

**API Key Issues:**
- Verify your API key is valid in the Infoblox portal
- Test the key with curl:
  ```bash
  curl -H "Authorization: Token your_api_key_here" \
       https://csp.infoblox.com/api/ddi/v1/ipam/ip_space
  ```

##### Complete Example Configuration

Here's a complete `claude_desktop_config.json` example:

```json
{
  "globalShortcut": "Cmd+Shift+C",
  "mcpServers": {
    "infoblox-uddi-ipam": {
      "command": "npx",
      "args": ["infoblox-uddi-ipam-mcp-server"],
      "env": {
        "INFOBLOX_API_KEY": "Token abcd1234-ef56-7890-abcd-ef1234567890",
        "INFOBLOX_BASE_URL": "https://csp.infoblox.com"
      }
    },
    "other-mcp-server": {
      "command": "other-server",
      "args": []
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, use the server executable:

```bash
node server.js
```

Or if installed globally:

```bash
infoblox-mcp-server
```

## Usage

### Starting the Server

```bash
# If installed globally
infoblox-mcp-server

# If running from source
npm start

# Development mode with debugging
npm run dev
```

### Testing the Connection

You can test the server connection using the included test script:

```bash
node test.js
```

## Available Tools

### IP Space Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_ip_spaces` | List all IP spaces | None |
| `get_ip_space` | Get specific IP space details | `id` |
| `create_ip_space` | Create a new IP space | `name` |

### Address Block Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_address_blocks` | List address blocks | None |
| `get_address_block` | Get specific address block | `id` |
| `create_address_block` | Create new address block | `space`, `address` |
| `get_next_available_address_block` | Get next available address block | `id`, `cidr` |

### Subnet Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_subnets` | List all subnets | None |
| `get_subnet` | Get specific subnet details | `id` |
| `create_subnet` | Create a new subnet | `space`, `address` |
| `get_next_available_subnet` | Get next available subnet | `id`, `cidr` |

### IP Address Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_addresses` | List IP addresses | None |
| `get_address` | Get specific address details | `id` |
| `create_address` | Create/reserve IP address | `space`, `address` |
| `get_next_available_ip` | Get next available IP | `id`, `type` |

### Range Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_ranges` | List DHCP ranges | None |
| `get_range` | Get specific range details | `id` |
| `create_range` | Create new DHCP range | `space`, `start`, `end` |

### DHCP Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_dhcp_hosts` | List DHCP hosts | None |
| `get_dhcp_host` | Get DHCP host details | `id` |
| `list_fixed_addresses` | List DHCP reservations | None |
| `create_fixed_address` | Create DHCP reservation | `address`, `match_type`, `match_value` |

### Host Management

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_ipam_hosts` | List IPAM hosts | None |
| `get_ipam_host` | Get IPAM host details | `id` |
| `create_ipam_host` | Create IPAM host | `name` |

### Monitoring & Analytics

| Tool | Description | Required Parameters |
|------|-------------|--------------------|
| `list_dns_usage` | List DNS usage records | None |
| `get_subnet_utilization` | Get subnet utilization stats | `subnet_id` |
| `list_asm_suggestions` | List ASM suggestions | None |

## Built-in Prompts

### Network Health Check

Generate comprehensive network health reports:

```
Prompt: network_health_check
Parameters:
- ip_space_name (optional): Target IP space
- include_utilization (optional): Include utilization stats
```

### Subnet Planning

Assist with subnet planning and allocation:

```
Prompt: subnet_planning
Parameters:
- parent_block (required): Parent address block
- required_subnets (required): Number of subnets needed
- subnet_size (required): Subnet size in CIDR notation
```

## Authentication

### API Key Requirements

The server requires a valid Infoblox BloxOne DDI API key with the following minimum permissions:

- **IPAM**: Read/Write access to IP spaces, address blocks, subnets, and addresses
- **DHCP**: Read/Write access to DHCP hosts, ranges, and fixed addresses
- **DNS**: Read access for DNS usage tracking (optional)

### API Key Format

The API key should be in one of these formats:
- `Token your_api_key_here`
- `your_api_key_here` (the server will automatically add "Token " prefix)

### Security Best Practices

- Store API keys in environment variables, never in code
- Use least-privilege API keys with only required permissions
- Rotate API keys regularly
- Monitor API usage for unusual activity

## Error Handling

The server provides detailed error messages for common issues:

### Authentication Errors (401)
- Invalid API key
- Expired API key
- Incorrect API key format

### Authorization Errors (403)
- Insufficient permissions
- Resource access denied

### Not Found Errors (404)
- Invalid resource ID
- Incorrect endpoint

### Rate Limiting

The server respects Infoblox API rate limits and will provide appropriate error messages if limits are exceeded.

## Examples

### Basic Usage with AI Assistant

```
User: "List all IP spaces in our Infoblox system"
AI: Uses list_ip_spaces tool to retrieve and display all IP spaces

User: "Create a new subnet 192.168.100.0/24 in the 'Production' IP space"
AI: Uses create_subnet tool with the specified parameters

User: "Find the next available IP address in subnet xyz123"
AI: Uses get_next_available_ip tool to find and reserve the next IP
```

### Network Health Check

```
User: "Generate a network health report for our production environment"
AI: Uses the network_health_check prompt to analyze IP space utilization,
    subnet allocation, and generate recommendations
```

### Subnet Planning

```
User: "Help me plan subnets for a new office that needs 5 /26 networks"
AI: Uses subnet_planning prompt to analyze available space and suggest
    optimal subnet allocation strategy
```

## Troubleshooting

### Common Issues

#### Server Won't Start
1. Verify Node.js version (>= 16.0.0)
2. Check that all dependencies are installed: `npm install`
3. Ensure INFOBLOX_API_KEY is set

#### Authentication Failures
1. Verify API key format and validity
2. Check API key permissions in Infoblox portal
3. Ensure correct base URL for your Infoblox instance

#### Connection Issues
1. Verify network connectivity to Infoblox instance
2. Check firewall rules
3. Validate base URL format

#### Tool Execution Errors
1. Check parameter formats (IDs, CIDR notation, etc.)
2. Verify resource exists before operations
3. Ensure adequate API permissions

### Debug Mode

Enable debug logging:

```bash
DEBUG=* npm run dev
```

### Log Analysis

The server logs detailed information about:
- API requests and responses
- Authentication attempts
- Error conditions
- Performance metrics

## API Rate Limits

The Infoblox BloxOne DDI API has rate limits. The server handles these gracefully:

- Default timeout: 30 seconds
- Automatic retry for transient errors
- Detailed rate limit error messages

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

### Code Style

- Follow existing code formatting
- Add JSDoc comments for new methods
- Include error handling for all API calls
- Add appropriate logging

### Testing

Run the test suite:

```bash
npm test
```

## Changelog

### v1.0.0
- Initial release
- Full IPAM functionality
- DHCP management
- Built-in prompts for network health and subnet planning
- Comprehensive error handling

## Support

- **Issues**: Report bugs and feature requests via [GitHub Issues](https://github.com/your-org/infoblox-uddi-ipam-mcp-server/issues)
- **Documentation**: Additional documentation available in the `/docs` folder
- **Community**: Join our discussions in [GitHub Discussions](https://github.com/your-org/infoblox-uddi-ipam-mcp-server/discussions)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [Infoblox](https://www.infoblox.com/) for the BloxOne DDI platform
- The open-source community for contributions and feedback
