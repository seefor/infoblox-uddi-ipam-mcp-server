#!/usr/bin/env node

/**
 * Infoblox UDDI IPAM MCP Server
 * 
 * This Model Context Protocol (MCP) server provides access to Infoblox BloxOne DDI
 * IP Address Management (IPAM) and DHCP services. It enables AI assistants to
 * interact with Infoblox infrastructure for network management tasks.
 * 
 * Features:
 * - IP Space management
 * - Address Block operations
 * - Subnet management
 * - IP Address allocation and management
 * - DHCP configuration
 * - Range management
 * - Host management
 * - DNS usage tracking
 * 
 * Author: Generated for Infoblox UDDI integration
 * Version: 1.0.0
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

class InfobloxMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'infoblox-uddi-ipam',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    // Configuration
    this.baseUrl = process.env.INFOBLOX_BASE_URL || 'https://csp.infoblox.com';
    this.apiKey = process.env.INFOBLOX_API_KEY;
    this.basePath = '/api/ddi/v1';

    if (!this.apiKey) {
      throw new Error('INFOBLOX_API_KEY environment variable is required');
    }

    this.setupToolHandlers();
  }

  /**
   * Create HTTP client with authentication
   */
  createClient() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Infoblox CSP uses "Token" authentication, not "Bearer"
    if (this.apiKey.startsWith('Token ')) {
      headers['Authorization'] = this.apiKey;
    } else {
      headers['Authorization'] = `Token ${this.apiKey}`;
    }

    console.error(`[DEBUG] Using base URL: ${this.baseUrl}${this.basePath}`);
    console.error(`[DEBUG] Auth header: ${headers['Authorization'].substring(0, 20)}...`);

    return axios.create({
      baseURL: `${this.baseUrl}${this.basePath}`,
      headers,
      timeout: 30000,
      // Force HTTP/1.1 like the curl example
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true }),
      validateStatus: function (status) {
        // Don't throw for any status code so we can handle errors properly
        return status < 500;
      },
    });
  }

  /**
   * Setup tool handlers for the MCP server
   */
  setupToolHandlers() {
    // Add prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'network_health_check',
          description: 'Generate a comprehensive network health report for IP spaces',
          arguments: [
            {
              name: 'ip_space_name',
              description: 'Name of the IP space to analyze (optional)',
              required: false,
            },
            {
              name: 'include_utilization',
              description: 'Include utilization statistics in the report',
              required: false,
            },
          ],
        },
        {
          name: 'subnet_planning',
          description: 'Assist with subnet planning and allocation strategy',
          arguments: [
            {
              name: 'parent_block',
              description: 'Parent address block for subnet planning',
              required: true,
            },
            {
              name: 'required_subnets',
              description: 'Number of subnets needed',
              required: true,
            },
            {
              name: 'subnet_size',
              description: 'Required subnet size (CIDR notation)',
              required: true,
            },
          ],
        },
      ],
    }));
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // IP Space Management
        {
          name: 'list_ip_spaces',
          description: 'List all IP spaces in the Infoblox system',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression for IP spaces' },
              limit: { type: 'number', description: 'Maximum number of results (default: 100)' },
              offset: { type: 'number', description: 'Number of results to skip (default: 0)' },
            },
          },
        },
        {
          name: 'get_ip_space',
          description: 'Get details of a specific IP space by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'IP space ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_ip_space',
          description: 'Create a new IP space',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the IP space' },
              comment: { type: 'string', description: 'Description of the IP space' },
              dhcp_config: { type: 'object', description: 'DHCP configuration' },
            },
            required: ['name'],
          },
        },

        // Address Block Management
        {
          name: 'list_address_blocks',
          description: 'List address blocks within IP spaces',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results (default: 100)' },
              offset: { type: 'number', description: 'Offset for pagination' },
            },
          },
        },
        {
          name: 'get_address_block',
          description: 'Get details of a specific address block',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Address block ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_address_block',
          description: 'Create a new address block',
          inputSchema: {
            type: 'object',
            properties: {
              space: { type: 'string', description: 'IP space ID' },
              address: { type: 'string', description: 'CIDR address (e.g., 192.168.1.0/24)' },
              name: { type: 'string', description: 'Name of the address block' },
              comment: { type: 'string', description: 'Description' },
            },
            required: ['space', 'address'],
          },
        },
        {
          name: 'get_next_available_address_block',
          description: 'Get next available address block from a parent block',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Parent address block ID' },
              cidr: { type: 'number', description: 'CIDR value for new block' },
              count: { type: 'number', description: 'Number of blocks to generate (default: 1)' },
              name: { type: 'string', description: 'Name for new blocks' },
            },
            required: ['id', 'cidr'],
          },
        },

        // Subnet Management
        {
          name: 'list_subnets',
          description: 'List subnets in the IPAM system',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
              offset: { type: 'number', description: 'Offset for pagination' },
            },
          },
        },
        {
          name: 'get_subnet',
          description: 'Get details of a specific subnet',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Subnet ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_subnet',
          description: 'Create a new subnet',
          inputSchema: {
            type: 'object',
            properties: {
              space: { type: 'string', description: 'IP space ID' },
              address: { type: 'string', description: 'Subnet address with CIDR' },
              name: { type: 'string', description: 'Subnet name' },
              comment: { type: 'string', description: 'Description' },
              dhcp_host: { type: 'string', description: 'DHCP host ID' },
            },
            required: ['space', 'address'],
          },
        },
        {
          name: 'get_next_available_subnet',
          description: 'Get next available subnet from a parent address block',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Parent address block ID' },
              cidr: { type: 'number', description: 'CIDR value for subnet' },
              count: { type: 'number', description: 'Number of subnets (default: 1)' },
              name: { type: 'string', description: 'Name for subnets' },
            },
            required: ['id', 'cidr'],
          },
        },

        // IP Address Management
        {
          name: 'list_addresses',
          description: 'List IP addresses',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
              offset: { type: 'number', description: 'Offset for pagination' },
              address_state: { type: 'string', description: 'Filter by address state (used/free)' },
            },
          },
        },
        {
          name: 'get_address',
          description: 'Get details of a specific IP address',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Address ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_address',
          description: 'Create/reserve an IP address',
          inputSchema: {
            type: 'object',
            properties: {
              space: { type: 'string', description: 'IP space ID' },
              address: { type: 'string', description: 'IP address' },
              comment: { type: 'string', description: 'Description' },
              host: { type: 'string', description: 'Host ID' },
            },
            required: ['space', 'address'],
          },
        },
        {
          name: 'get_next_available_ip',
          description: 'Get next available IP address from subnet or range',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Subnet or range ID' },
              type: { type: 'string', enum: ['subnet', 'range'], description: 'Type of parent object' },
              count: { type: 'number', description: 'Number of IPs (default: 1)' },
              contiguous: { type: 'boolean', description: 'Whether IPs should be contiguous' },
            },
            required: ['id', 'type'],
          },
        },

        // Range Management
        {
          name: 'list_ranges',
          description: 'List DHCP ranges',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
              offset: { type: 'number', description: 'Offset for pagination' },
            },
          },
        },
        {
          name: 'get_range',
          description: 'Get details of a specific range',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Range ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_range',
          description: 'Create a new DHCP range',
          inputSchema: {
            type: 'object',
            properties: {
              space: { type: 'string', description: 'IP space ID' },
              start: { type: 'string', description: 'Start IP address' },
              end: { type: 'string', description: 'End IP address' },
              name: { type: 'string', description: 'Range name' },
              comment: { type: 'string', description: 'Description' },
            },
            required: ['space', 'start', 'end'],
          },
        },

        // DHCP Management
        {
          name: 'list_dhcp_hosts',
          description: 'List DHCP hosts',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
            },
          },
        },
        {
          name: 'get_dhcp_host',
          description: 'Get DHCP host details',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'DHCP host ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_fixed_addresses',
          description: 'List DHCP fixed addresses (reservations)',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
            },
          },
        },
        {
          name: 'create_fixed_address',
          description: 'Create a DHCP fixed address reservation',
          inputSchema: {
            type: 'object',
            properties: {
              address: { type: 'string', description: 'IP address to reserve' },
              match_type: { type: 'string', description: 'Match type (mac, client_text, etc.)' },
              match_value: { type: 'string', description: 'Value to match (MAC address, client ID, etc.)' },
              comment: { type: 'string', description: 'Description' },
            },
            required: ['address', 'match_type', 'match_value'],
          },
        },

        // Host Management (IPAM Hosts)
        {
          name: 'list_ipam_hosts',
          description: 'List IPAM hosts',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
            },
          },
        },
        {
          name: 'get_ipam_host',
          description: 'Get IPAM host details',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'IPAM host ID' },
            },
            required: ['id'],
          },
        },
        {
          name: 'create_ipam_host',
          description: 'Create an IPAM host',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Host name' },
              comment: { type: 'string', description: 'Description' },
              addresses: { type: 'array', description: 'Array of address objects' },
            },
            required: ['name'],
          },
        },

        // DNS Usage
        {
          name: 'list_dns_usage',
          description: 'List DNS usage records for addresses',
          inputSchema: {
            type: 'object',
            properties: {
              filter: { type: 'string', description: 'Filter expression' },
              limit: { type: 'number', description: 'Maximum results' },
            },
          },
        },

        // Utilization and Statistics
        {
          name: 'get_subnet_utilization',
          description: 'Get utilization statistics for subnets',
          inputSchema: {
            type: 'object',
            properties: {
              subnet_id: { type: 'string', description: 'Subnet ID for utilization stats' },
            },
            required: ['subnet_id'],
          },
        },

        // Automated Scope Management (ASM)
        {
          name: 'list_asm_suggestions',
          description: 'List ASM suggestions for scope management',
          inputSchema: {
            type: 'object',
            properties: {
              subnet_id: { type: 'string', description: 'Subnet ID to get ASM suggestions for' },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const client = this.createClient();
        let result;

        switch (name) {
          // IP Space operations
          case 'list_ip_spaces':
            result = await this.listIPSpaces(client, args);
            break;
          case 'get_ip_space':
            result = await this.getIPSpace(client, args.id);
            break;
          case 'create_ip_space':
            result = await this.createIPSpace(client, args);
            break;

          // Address Block operations
          case 'list_address_blocks':
            result = await this.listAddressBlocks(client, args);
            break;
          case 'get_address_block':
            result = await this.getAddressBlock(client, args.id);
            break;
          case 'create_address_block':
            result = await this.createAddressBlock(client, args);
            break;
          case 'get_next_available_address_block':
            result = await this.getNextAvailableAddressBlock(client, args);
            break;

          // Subnet operations
          case 'list_subnets':
            result = await this.listSubnets(client, args);
            break;
          case 'get_subnet':
            result = await this.getSubnet(client, args.id);
            break;
          case 'create_subnet':
            result = await this.createSubnet(client, args);
            break;
          case 'get_next_available_subnet':
            result = await this.getNextAvailableSubnet(client, args);
            break;

          // Address operations
          case 'list_addresses':
            result = await this.listAddresses(client, args);
            break;
          case 'get_address':
            result = await this.getAddress(client, args.id);
            break;
          case 'create_address':
            result = await this.createAddress(client, args);
            break;
          case 'get_next_available_ip':
            result = await this.getNextAvailableIP(client, args);
            break;

          // Range operations
          case 'list_ranges':
            result = await this.listRanges(client, args);
            break;
          case 'get_range':
            result = await this.getRange(client, args.id);
            break;
          case 'create_range':
            result = await this.createRange(client, args);
            break;

          // DHCP operations
          case 'list_dhcp_hosts':
            result = await this.listDHCPHosts(client, args);
            break;
          case 'get_dhcp_host':
            result = await this.getDHCPHost(client, args.id);
            break;
          case 'list_fixed_addresses':
            result = await this.listFixedAddresses(client, args);
            break;
          case 'create_fixed_address':
            result = await this.createFixedAddress(client, args);
            break;

          // IPAM Host operations
          case 'list_ipam_hosts':
            result = await this.listIPAMHosts(client, args);
            break;
          case 'get_ipam_host':
            result = await this.getIPAMHost(client, args.id);
            break;
          case 'create_ipam_host':
            result = await this.createIPAMHost(client, args);
            break;

          // DNS Usage
          case 'list_dns_usage':
            result = await this.listDNSUsage(client, args);
            break;

          // Utilization
          case 'get_subnet_utilization':
            result = await this.getSubnet(client, args.subnet_id);
            break;

          // ASM
          case 'list_asm_suggestions':
            result = await this.listASMSuggestions(client, args);
            break;

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        console.error(`[ERROR] Tool ${name} failed:`, error.message);
        
        if (error.response) {
          const status = error.response.status;
          const statusText = error.response.statusText;
          const errorData = error.response.data;
          
          console.error(`[ERROR] HTTP ${status}: ${statusText}`);
          console.error(`[ERROR] Response data:`, errorData);
          
          let message = `Infoblox API Error: ${status} - ${statusText}`;
          
          if (status === 401) {
            message += '\n\nAuthentication failed. Please check:\n' +
                     '1. Your INFOBLOX_API_KEY is correct\n' +
                     '2. The API key has proper permissions\n' +
                     '3. The API key hasn\'t expired\n' +
                     '4. You\'re connecting to the correct Infoblox instance';
          } else if (status === 403) {
            message += '\n\nAccess forbidden. Your API key may not have sufficient permissions.';
          } else if (status === 404) {
            message += '\n\nResource not found. Check if the ID or endpoint is correct.';
          }
          
          if (errorData?.message) {
            message += `\n\nDetails: ${errorData.message}`;
          }
          
          throw new McpError(ErrorCode.InternalError, message);
        }
        
        throw new McpError(ErrorCode.InternalError, `Error: ${error.message}`);
      }
    });
  }

  // Helper method to build query parameters
  buildQueryParams(params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return queryParams.toString();
  }

  // IP Space Methods
  async listIPSpaces(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
      _offset: args.offset || 0,
    });
    const response = await client.get(`/ipam/ip_space?${params}`);
    return response.data;
  }

  async getIPSpace(client, id) {
    const response = await client.get(`/ipam/ip_space/${id}`);
    return response.data;
  }

  async createIPSpace(client, data) {
    const response = await client.post('/ipam/ip_space', data);
    return response.data;
  }

  // Address Block Methods
  async listAddressBlocks(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
      _offset: args.offset || 0,
    });
    const response = await client.get(`/ipam/address_block?${params}`);
    return response.data;
  }

  async getAddressBlock(client, id) {
    const response = await client.get(`/ipam/address_block/${id}`);
    return response.data;
  }

  async createAddressBlock(client, data) {
    const response = await client.post('/ipam/address_block', data);
    return response.data;
  }

  async getNextAvailableAddressBlock(client, args) {
    const params = this.buildQueryParams({
      cidr: args.cidr,
      count: args.count || 1,
      name: args.name,
    });
    const response = await client.get(`/ipam/address_block/${args.id}/nextavailableaddressblock?${params}`);
    return response.data;
  }

  // Subnet Methods
  async listSubnets(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
      _offset: args.offset || 0,
    });
    const response = await client.get(`/ipam/subnet?${params}`);
    return response.data;
  }

  async getSubnet(client, id) {
    const response = await client.get(`/ipam/subnet/${id}`);
    return response.data;
  }

  async createSubnet(client, data) {
    const response = await client.post('/ipam/subnet', data);
    return response.data;
  }

  async getNextAvailableSubnet(client, args) {
    const params = this.buildQueryParams({
      cidr: args.cidr,
      count: args.count || 1,
      name: args.name,
    });
    const response = await client.get(`/ipam/address_block/${args.id}/nextavailablesubnet?${params}`);
    return response.data;
  }

  // Address Methods
  async listAddresses(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
      _offset: args.offset || 0,
      address_state: args.address_state,
    });
    const response = await client.get(`/ipam/address?${params}`);
    return response.data;
  }

  async getAddress(client, id) {
    const response = await client.get(`/ipam/address/${id}`);
    return response.data;
  }

  async createAddress(client, data) {
    const response = await client.post('/ipam/address', data);
    return response.data;
  }

  async getNextAvailableIP(client, args) {
    const params = this.buildQueryParams({
      count: args.count || 1,
      contiguous: args.contiguous,
    });
    const endpoint = args.type === 'subnet' ? 'subnet' : 'range';
    const response = await client.get(`/ipam/${endpoint}/${args.id}/nextavailableip?${params}`);
    return response.data;
  }

  // Range Methods
  async listRanges(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
      _offset: args.offset || 0,
    });
    const response = await client.get(`/ipam/range?${params}`);
    return response.data;
  }

  async getRange(client, id) {
    const response = await client.get(`/ipam/range/${id}`);
    return response.data;
  }

  async createRange(client, data) {
    const response = await client.post('/ipam/range', data);
    return response.data;
  }

  // DHCP Methods
  async listDHCPHosts(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
    });
    const response = await client.get(`/dhcp/host?${params}`);
    return response.data;
  }

  async getDHCPHost(client, id) {
    const response = await client.get(`/dhcp/host/${id}`);
    return response.data;
  }

  async listFixedAddresses(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
    });
    const response = await client.get(`/dhcp/fixed_address?${params}`);
    return response.data;
  }

  async createFixedAddress(client, data) {
    const response = await client.post('/dhcp/fixed_address', data);
    return response.data;
  }

  // IPAM Host Methods
  async listIPAMHosts(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
    });
    const response = await client.get(`/ipam/host?${params}`);
    return response.data;
  }

  async getIPAMHost(client, id) {
    const response = await client.get(`/ipam/host/${id}`);
    return response.data;
  }

  async createIPAMHost(client, data) {
    const response = await client.post('/ipam/host', data);
    return response.data;
  }

  // DNS Usage Methods
  async listDNSUsage(client, args = {}) {
    const params = this.buildQueryParams({
      _filter: args.filter,
      _limit: args.limit || 100,
    });
    const response = await client.get(`/ipam/dns_usage?${params}`);
    return response.data;
  }

  // ASM Methods
  async listASMSuggestions(client, args = {}) {
    const params = this.buildQueryParams({
      subnet_id: args.subnet_id,
    });
    const response = await client.get(`/ipam/asm?${params}`);
    return response.data;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Infoblox UDDI IPAM MCP server running on stdio');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new InfobloxMCPServer();
  server.run().catch(console.error);
}

module.exports = InfobloxMCPServer;
