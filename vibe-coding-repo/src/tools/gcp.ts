import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { formatToolResponse } from '../utils/response.js';

const execAsync = promisify(exec);

/**
 * Helper function to execute gcloud commands with proper error handling
 * Uses Application Default Credentials (ADC) automatically
 */
async function executeGcloudCommand(command: string): Promise<any> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    if (stderr && !stderr.includes('Updated property') && !stderr.includes('WARNING')) {
      console.error('gcloud stderr:', stderr);
    }

    try {
      return JSON.parse(stdout);
    } catch {
      return { output: stdout, raw: true };
    }
  } catch (error: any) {
    throw new Error(`gcloud command failed: ${error.message}\nCommand: ${command}`);
  }
}

// ============================================================================
// AUTHENTICATION & CONFIGURATION TOOLS
// ============================================================================

const gcloud_auth_login = {
  name: 'gcloud_auth_login',
  description:
    'Authenticate with Google Cloud using Application Default Credentials (ADC). This will open a browser for OAuth flow.',
  inputSchema: z.object({
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe('Force re-authentication even if already logged in'),
  }),
  handler: async (args: any) => {
    try {
      const command = args.force
        ? 'gcloud auth application-default login --force'
        : 'gcloud auth application-default login';

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        message: 'Successfully authenticated with Google Cloud ADC',
        result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_auth_list = {
  name: 'gcloud_auth_list',
  description: 'List all authenticated accounts and show the active account',
  inputSchema: z.object({}),
  handler: async (args: any) => {
    try {
      const result = await executeGcloudCommand('gcloud auth list --format=json');
      return formatToolResponse({
        success: true,
        accounts: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_auth_print_access_token = {
  name: 'gcloud_auth_print_access_token',
  description: 'Generate and print an access token for the active account. Useful for API calls.',
  inputSchema: z.object({
    account: z.string().optional().describe('Specific account to get token for (optional)'),
  }),
  handler: async (args: any) => {
    try {
      const command = args.account
        ? `gcloud auth print-access-token --account=${args.account}`
        : 'gcloud auth print-access-token';

      const { stdout } = await execAsync(command);
      return formatToolResponse({
        success: true,
        access_token: stdout.trim(),
        note: 'This token expires in 1 hour',
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_auth_print_identity_token = {
  name: 'gcloud_auth_print_identity_token',
  description:
    'Generate and print an identity token (JWT) for the active account. Used for authenticating to Cloud Run and other services.',
  inputSchema: z.object({
    audiences: z.string().describe('Comma-separated list of audiences for the token'),
    account: z.string().optional().describe('Specific account to get token for (optional)'),
    include_email: z.boolean().optional().default(true).describe('Include email in the token'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud auth print-identity-token --audiences=${args.audiences}`;

      if (args.account) {
        command += ` --account=${args.account}`;
      }

      if (args.include_email) {
        command += ' --include-email';
      }

      const { stdout } = await execAsync(command);
      return formatToolResponse({
        success: true,
        identity_token: stdout.trim(),
        audiences: args.audiences,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_config_set = {
  name: 'gcloud_config_set',
  description: 'Set a gcloud configuration property (project, region, zone, etc.)',
  inputSchema: z.object({
    property: z
      .string()
      .describe("Property to set (e.g., 'project', 'compute/region', 'compute/zone')"),
    value: z.string().describe('Value to set'),
  }),
  handler: async (args: any) => {
    try {
      await executeGcloudCommand(`gcloud config set ${args.property} ${args.value}`);
      return formatToolResponse({
        success: true,
        message: `Set ${args.property} to ${args.value}`,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_config_get = {
  name: 'gcloud_config_get',
  description: 'Get the value of a gcloud configuration property',
  inputSchema: z.object({
    property: z
      .string()
      .describe("Property to get (e.g., 'project', 'compute/region', 'compute/zone')"),
  }),
  handler: async (args: any) => {
    try {
      const { stdout } = await execAsync(`gcloud config get-value ${args.property}`);
      return formatToolResponse({
        success: true,
        property: args.property,
        value: stdout.trim(),
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_config_list = {
  name: 'gcloud_config_list',
  description: 'List all gcloud configuration properties',
  inputSchema: z.object({}),
  handler: async (args: any) => {
    try {
      const result = await executeGcloudCommand('gcloud config list --format=json');
      return formatToolResponse({
        success: true,
        config: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// CLOUD LOGGING TOOLS
// ============================================================================

const gcloud_logging_read = {
  name: 'gcloud_logging_read',
  description: 'Read logs from Cloud Logging with filters and time range',
  inputSchema: z.object({
    filter: z
      .string()
      .optional()
      .describe("Log filter query (e.g., 'resource.type=cloud_run_revision')"),
    limit: z.number().optional().default(50).describe('Maximum number of log entries to return'),
    freshness: z
      .string()
      .optional()
      .describe("Return logs newer than this duration (e.g., '1h', '30m', '7d')"),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order by timestamp'),
    format: z.enum(['json', 'text']).optional().default('json').describe('Output format'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud logging read --format=${args.format} --limit=${args.limit} --order=${args.order}`;

      if (args.filter) {
        command += ` "${args.filter}"`;
      }

      if (args.freshness) {
        command += ` --freshness=${args.freshness}`;
      }

      console.error(`[gcloud_logging_read] Executing command: ${command}`);
      const result = await executeGcloudCommand(command);
      console.error(
        `[gcloud_logging_read] Result type: ${typeof result}, isArray: ${Array.isArray(result)}, length: ${Array.isArray(result) ? result.length : 'N/A'}`
      );

      return formatToolResponse({
        success: true,
        logs: result,
        count: Array.isArray(result) ? result.length : 0,
        command: command,
      });
    } catch (error: any) {
      console.error(`[gcloud_logging_read] Error: ${error.message}`);
      return formatToolResponse({
        success: false,
        error: error.message,
        command: `gcloud logging read --format=${args.format} --limit=${args.limit} --order=${args.order}`,
      });
    }
  },
};

const gcloud_logging_write = {
  name: 'gcloud_logging_write',
  description: 'Write a log entry to Cloud Logging',
  inputSchema: z.object({
    log_name: z.string().describe('Name of the log to write to'),
    message: z.string().describe('Log message text'),
    severity: z
      .enum([
        'DEFAULT',
        'DEBUG',
        'INFO',
        'NOTICE',
        'WARNING',
        'ERROR',
        'CRITICAL',
        'ALERT',
        'EMERGENCY',
      ])
      .optional()
      .default('INFO')
      .describe('Log severity level'),
    resource_type: z
      .string()
      .optional()
      .default('global')
      .describe("Resource type (e.g., 'cloud_run_revision', 'gce_instance', 'global')"),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud logging write ${args.log_name} "${args.message}" --severity=${args.severity} --resource=${args.resource_type}`;
      await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        message: 'Log entry written successfully',
        log_name: args.log_name,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// GKE (GOOGLE KUBERNETES ENGINE) TOOLS
// ============================================================================

const gcloud_container_clusters_list = {
  name: 'gcloud_container_clusters_list',
  description: 'List all GKE clusters in the current project',
  inputSchema: z.object({
    region: z.string().optional().describe("Filter by region (e.g., 'us-central1')"),
    zone: z.string().optional().describe("Filter by zone (e.g., 'us-central1-a')"),
  }),
  handler: async (args: any) => {
    try {
      let command = 'gcloud container clusters list --format=json';

      if (args.region) {
        command += ` --region=${args.region}`;
      } else if (args.zone) {
        command += ` --zone=${args.zone}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        clusters: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_container_clusters_describe = {
  name: 'gcloud_container_clusters_describe',
  description: 'Get detailed information about a specific GKE cluster',
  inputSchema: z.object({
    cluster_name: z.string().describe('Name of the GKE cluster'),
    region: z.string().optional().describe('Region of the cluster'),
    zone: z.string().optional().describe('Zone of the cluster'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud container clusters describe ${args.cluster_name} --format=json`;

      if (args.region) {
        command += ` --region=${args.region}`;
      } else if (args.zone) {
        command += ` --zone=${args.zone}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        cluster: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_container_clusters_get_credentials = {
  name: 'gcloud_container_clusters_get_credentials',
  description: 'Get kubectl credentials for a GKE cluster',
  inputSchema: z.object({
    cluster_name: z.string().describe('Name of the GKE cluster'),
    region: z.string().optional().describe('Region of the cluster'),
    zone: z.string().optional().describe('Zone of the cluster'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud container clusters get-credentials ${args.cluster_name}`;

      if (args.region) {
        command += ` --region=${args.region}`;
      } else if (args.zone) {
        command += ` --zone=${args.zone}`;
      }

      await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        message: `Credentials configured for cluster ${args.cluster_name}`,
        cluster: args.cluster_name,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_container_node_pools_list = {
  name: 'gcloud_container_node_pools_list',
  description: 'List node pools in a GKE cluster',
  inputSchema: z.object({
    cluster_name: z.string().describe('Name of the GKE cluster'),
    region: z.string().optional().describe('Region of the cluster'),
    zone: z.string().optional().describe('Zone of the cluster'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud container node-pools list --cluster=${args.cluster_name} --format=json`;

      if (args.region) {
        command += ` --region=${args.region}`;
      } else if (args.zone) {
        command += ` --zone=${args.zone}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        node_pools: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// BIGQUERY TOOLS
// ============================================================================

const gcloud_bq_query = {
  name: 'gcloud_bq_query',
  description: 'Execute a BigQuery SQL query',
  inputSchema: z.object({
    query: z.string().describe('SQL query to execute'),
    use_legacy_sql: z
      .boolean()
      .optional()
      .default(false)
      .describe('Use legacy SQL instead of standard SQL'),
    max_rows: z.number().optional().describe('Maximum number of rows to return'),
    dry_run: z.boolean().optional().default(false).describe('Validate query without executing'),
  }),
  handler: async (args: any) => {
    try {
      let command = `bq query --format=json --nouse_legacy_sql`;

      if (args.use_legacy_sql) {
        command = `bq query --format=json --use_legacy_sql`;
      }

      if (args.max_rows) {
        command += ` --max_rows=${args.max_rows}`;
      }

      if (args.dry_run) {
        command += ' --dry_run';
      }

      command += ` '${args.query.replace(/'/g, "'\\''")}'`;

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        result,
        dry_run: args.dry_run,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_bq_ls = {
  name: 'gcloud_bq_ls',
  description: 'List BigQuery datasets or tables',
  inputSchema: z.object({
    dataset: z
      .string()
      .optional()
      .describe('Dataset name to list tables from (if not provided, lists datasets)'),
    project: z.string().optional().describe('Project ID (uses current project if not specified)'),
    max_results: z.number().optional().describe('Maximum number of results to return'),
  }),
  handler: async (args: any) => {
    try {
      let command = 'bq ls --format=json';

      if (args.project) {
        command += ` --project_id=${args.project}`;
      }

      if (args.max_results) {
        command += ` --max_results=${args.max_results}`;
      }

      if (args.dataset) {
        command += ` ${args.dataset}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        items: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_bq_show = {
  name: 'gcloud_bq_show',
  description: 'Show details about a BigQuery dataset or table',
  inputSchema: z.object({
    resource: z
      .string()
      .describe("Resource to describe (format: 'project:dataset' or 'project:dataset.table')"),
  }),
  handler: async (args: any) => {
    try {
      const command = `bq show --format=json ${args.resource}`;
      const result = await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        resource: args.resource,
        details: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_bq_mk = {
  name: 'gcloud_bq_mk',
  description: 'Create a BigQuery dataset or table',
  inputSchema: z.object({
    resource: z.string().describe("Resource to create (format: 'dataset' or 'dataset.table')"),
    schema: z
      .string()
      .optional()
      .describe("Table schema (for table creation, format: 'field1:type1,field2:type2')"),
    description: z.string().optional().describe('Description of the dataset or table'),
    location: z.string().optional().describe("Location for the dataset (e.g., 'US', 'EU')"),
  }),
  handler: async (args: any) => {
    try {
      let command = `bq mk`;

      if (args.location) {
        command += ` --location=${args.location}`;
      }

      if (args.description) {
        command += ` --description="${args.description}"`;
      }

      command += ` ${args.resource}`;

      if (args.schema) {
        command += ` ${args.schema}`;
      }

      await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        message: `Created ${args.resource}`,
        resource: args.resource,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// DATAFLOW TOOLS
// ============================================================================

const gcloud_dataflow_jobs_list = {
  name: 'gcloud_dataflow_jobs_list',
  description: 'List Dataflow jobs in the current project',
  inputSchema: z.object({
    region: z.string().optional().default('us-central1').describe('Region to list jobs from'),
    status: z
      .enum(['active', 'terminated', 'all'])
      .optional()
      .default('all')
      .describe('Filter by job status'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud dataflow jobs list --region=${args.region} --format=json`;

      if (args.status !== 'all') {
        command += ` --status=${args.status}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        jobs: result,
        count: Array.isArray(result) ? result.length : 0,
        region: args.region,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_dataflow_jobs_describe = {
  name: 'gcloud_dataflow_jobs_describe',
  description: 'Get detailed information about a Dataflow job',
  inputSchema: z.object({
    job_id: z.string().describe('Dataflow job ID'),
    region: z
      .string()
      .optional()
      .default('us-central1')
      .describe('Region where the job is running'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud dataflow jobs describe ${args.job_id} --region=${args.region} --format=json`;
      const result = await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        job: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_dataflow_jobs_cancel = {
  name: 'gcloud_dataflow_jobs_cancel',
  description: 'Cancel a running Dataflow job',
  inputSchema: z.object({
    job_id: z.string().describe('Dataflow job ID to cancel'),
    region: z
      .string()
      .optional()
      .default('us-central1')
      .describe('Region where the job is running'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud dataflow jobs cancel ${args.job_id} --region=${args.region}`;
      await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        message: `Cancelled job ${args.job_id}`,
        job_id: args.job_id,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// RESOURCE MANAGER TOOLS
// ============================================================================

const gcloud_projects_list = {
  name: 'gcloud_projects_list',
  description: 'List all GCP projects accessible to the authenticated user',
  inputSchema: z.object({
    filter: z.string().optional().describe("Filter expression (e.g., 'name:my-project*')"),
    limit: z.number().optional().describe('Maximum number of projects to return'),
  }),
  handler: async (args: any) => {
    try {
      let command = 'gcloud projects list --format=json';

      if (args.filter) {
        command += ` --filter="${args.filter}"`;
      }

      if (args.limit) {
        command += ` --limit=${args.limit}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        projects: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_projects_describe = {
  name: 'gcloud_projects_describe',
  description: 'Get detailed information about a specific GCP project',
  inputSchema: z.object({
    project_id: z.string().describe('Project ID to describe'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud projects describe ${args.project_id} --format=json`;
      const result = await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        project: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_services_list = {
  name: 'gcloud_services_list',
  description: 'List enabled Google Cloud APIs and services for a project',
  inputSchema: z.object({
    project: z.string().optional().describe('Project ID (uses current project if not specified)'),
    available: z
      .boolean()
      .optional()
      .default(false)
      .describe('List available services instead of enabled ones'),
  }),
  handler: async (args: any) => {
    try {
      let command = args.available
        ? 'gcloud services list --available --format=json'
        : 'gcloud services list --enabled --format=json';

      if (args.project) {
        command += ` --project=${args.project}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        services: result,
        count: Array.isArray(result) ? result.length : 0,
        type: args.available ? 'available' : 'enabled',
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_services_enable = {
  name: 'gcloud_services_enable',
  description: 'Enable a Google Cloud API or service for a project',
  inputSchema: z.object({
    service: z.string().describe("Service name to enable (e.g., 'compute.googleapis.com')"),
    project: z.string().optional().describe('Project ID (uses current project if not specified)'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud services enable ${args.service}`;

      if (args.project) {
        command += ` --project=${args.project}`;
      }

      await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        message: `Enabled service ${args.service}`,
        service: args.service,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// COMPUTE ENGINE TOOLS
// ============================================================================

const gcloud_compute_instances_list = {
  name: 'gcloud_compute_instances_list',
  description: 'List Compute Engine VM instances',
  inputSchema: z.object({
    zone: z.string().optional().describe("Filter by zone (e.g., 'us-central1-a')"),
    filter: z.string().optional().describe('Filter expression'),
  }),
  handler: async (args: any) => {
    try {
      let command = 'gcloud compute instances list --format=json';

      if (args.zone) {
        command += ` --zones=${args.zone}`;
      }

      if (args.filter) {
        command += ` --filter="${args.filter}"`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        instances: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_compute_instances_describe = {
  name: 'gcloud_compute_instances_describe',
  description: 'Get detailed information about a Compute Engine VM instance',
  inputSchema: z.object({
    instance_name: z.string().describe('Name of the VM instance'),
    zone: z.string().describe('Zone where the instance is located'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud compute instances describe ${args.instance_name} --zone=${args.zone} --format=json`;
      const result = await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        instance: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// CLOUD RUN TOOLS
// ============================================================================

const gcloud_run_services_list = {
  name: 'gcloud_run_services_list',
  description: 'List Cloud Run services',
  inputSchema: z.object({
    region: z.string().optional().describe("Filter by region (e.g., 'us-central1')"),
    platform: z
      .enum(['managed', 'gke', 'kubernetes'])
      .optional()
      .default('managed')
      .describe('Cloud Run platform'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud run services list --platform=${args.platform} --format=json`;

      if (args.region) {
        command += ` --region=${args.region}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        services: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_run_services_describe = {
  name: 'gcloud_run_services_describe',
  description: 'Get detailed information about a Cloud Run service',
  inputSchema: z.object({
    service_name: z.string().describe('Name of the Cloud Run service'),
    region: z.string().describe('Region where the service is deployed'),
    platform: z
      .enum(['managed', 'gke', 'kubernetes'])
      .optional()
      .default('managed')
      .describe('Cloud Run platform'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud run services describe ${args.service_name} --region=${args.region} --platform=${args.platform} --format=json`;
      const result = await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        service: result,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// CLOUD STORAGE TOOLS
// ============================================================================

const gcloud_storage_buckets_list = {
  name: 'gcloud_storage_buckets_list',
  description: 'List Cloud Storage buckets',
  inputSchema: z.object({
    project: z.string().optional().describe('Project ID (uses current project if not specified)'),
  }),
  handler: async (args: any) => {
    try {
      let command = 'gcloud storage buckets list --format=json';

      if (args.project) {
        command += ` --project=${args.project}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        buckets: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_storage_ls = {
  name: 'gcloud_storage_ls',
  description: 'List objects in a Cloud Storage bucket or path',
  inputSchema: z.object({
    path: z
      .string()
      .describe("GCS path to list (e.g., 'gs://bucket-name' or 'gs://bucket-name/path/')"),
    recursive: z.boolean().optional().default(false).describe('List recursively'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud storage ls ${args.path}`;

      if (args.recursive) {
        command += ' --recursive';
      }

      const { stdout } = await execAsync(command);
      const items = stdout
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);

      return formatToolResponse({
        success: true,
        items,
        count: items.length,
        path: args.path,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// GENERIC GCLOUD WRAPPER
// ============================================================================

const gcloud_execute = {
  name: 'gcloud_execute',
  description:
    'Execute any gcloud command directly. This is a flexible wrapper that allows running any gcloud command with proper ADC authentication. Use this for commands not covered by specific tools.',
  inputSchema: z.object({
    command: z
      .string()
      .describe(
        "The gcloud command to execute (without 'gcloud' prefix, e.g., 'compute instances list')"
      ),
    format: z
      .enum(['json', 'yaml', 'text', 'default'])
      .optional()
      .default('json')
      .describe('Output format'),
    additional_flags: z.string().optional().describe('Additional flags to append to the command'),
  }),
  handler: async (args: any) => {
    try {
      let command = `gcloud ${args.command}`;

      if (args.format !== 'default') {
        command += ` --format=${args.format}`;
      }

      if (args.additional_flags) {
        command += ` ${args.additional_flags}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        result,
        command: command,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
        command: `gcloud ${args.command}`,
      });
    }
  },
};

// ============================================================================
// IAM TOOLS
// ============================================================================

const gcloud_iam_service_accounts_list = {
  name: 'gcloud_iam_service_accounts_list',
  description: 'List IAM service accounts in the current project',
  inputSchema: z.object({
    project: z.string().optional().describe('Project ID (uses current project if not specified)'),
  }),
  handler: async (args: any) => {
    try {
      let command = 'gcloud iam service-accounts list --format=json';

      if (args.project) {
        command += ` --project=${args.project}`;
      }

      const result = await executeGcloudCommand(command);
      return formatToolResponse({
        success: true,
        service_accounts: result,
        count: Array.isArray(result) ? result.length : 0,
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

const gcloud_iam_service_accounts_keys_create = {
  name: 'gcloud_iam_service_accounts_keys_create',
  description: 'Create a new key for a service account',
  inputSchema: z.object({
    service_account: z.string().describe('Service account email'),
    key_file: z.string().describe('Path where the key file should be saved'),
  }),
  handler: async (args: any) => {
    try {
      const command = `gcloud iam service-accounts keys create ${args.key_file} --iam-account=${args.service_account}`;
      await executeGcloudCommand(command);

      return formatToolResponse({
        success: true,
        message: `Created key for ${args.service_account}`,
        key_file: args.key_file,
        warning: 'Keep this key file secure and never commit it to version control',
      });
    } catch (error: any) {
      return formatToolResponse({
        success: false,
        error: error.message,
      });
    }
  },
};

// ============================================================================
// EXPORT ALL TOOLS
// ============================================================================

export const gcpTools = [
  // Authentication & Configuration
  gcloud_auth_login,
  gcloud_auth_list,
  gcloud_auth_print_access_token,
  gcloud_auth_print_identity_token,
  gcloud_config_set,
  gcloud_config_get,
  gcloud_config_list,

  // Cloud Logging
  gcloud_logging_read,
  gcloud_logging_write,

  // GKE (Container)
  gcloud_container_clusters_list,
  gcloud_container_clusters_describe,
  gcloud_container_clusters_get_credentials,
  gcloud_container_node_pools_list,

  // BigQuery
  gcloud_bq_query,
  gcloud_bq_ls,
  gcloud_bq_show,
  gcloud_bq_mk,

  // Dataflow
  gcloud_dataflow_jobs_list,
  gcloud_dataflow_jobs_describe,
  gcloud_dataflow_jobs_cancel,

  // Resource Manager
  gcloud_projects_list,
  gcloud_projects_describe,
  gcloud_services_list,
  gcloud_services_enable,

  // Compute Engine
  gcloud_compute_instances_list,
  gcloud_compute_instances_describe,

  // Cloud Run
  gcloud_run_services_list,
  gcloud_run_services_describe,

  // Cloud Storage
  gcloud_storage_buckets_list,
  gcloud_storage_ls,

  // IAM
  gcloud_iam_service_accounts_list,
  gcloud_iam_service_accounts_keys_create,

  // Generic wrapper
  gcloud_execute,
];
