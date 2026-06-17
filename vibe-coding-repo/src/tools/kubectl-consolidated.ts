import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { formatToolResponse } from '../utils/response.js';

const execAsync = promisify(exec);

export const kubernetesTools = [
  {
    name: 'kubectl',
    description:
      'Unified kubectl tool for Kubernetes operations. Supports get_pods, describe_pod, get_logs, get_deployments, get_services, get_events, and get_resource_status actions.',
    inputSchema: z.object({
      action: z
        .enum([
          'get_pods',
          'describe_pod',
          'get_logs',
          'get_deployments',
          'get_services',
          'get_events',
          'get_resource_status',
        ])
        .describe('Kubectl action to perform'),
      namespace: z.string().describe('Kubernetes namespace').default('default').optional(),
      name: z.string().describe('Resource name').optional(),
      labelSelector: z.string().describe('Label selector to filter pods').optional(),
      allNamespaces: z
        .boolean()
        .describe('Get resources from all namespaces')
        .default(false)
        .optional(),
      container: z.string().describe('Container name (for logs)').optional(),
      tail: z.number().describe('Number of lines to tail (for logs)').default(100).optional(),
      previous: z
        .boolean()
        .describe('Get logs from previous container instance')
        .default(false)
        .optional(),
      fieldSelector: z.string().describe('Field selector to filter events').optional(),
      resourceType: z.string().describe("Resource type (e.g., 'pod', 'deployment')").optional(),
    }),
    handler: async (args: any) => {
      try {
        switch (args.action) {
          case 'get_pods': {
            let command = 'kubectl get pods -o json';
            if (args.allNamespaces) {
              command += ' --all-namespaces';
            } else {
              command += ` -n ${args.namespace || 'default'}`;
            }
            if (args.labelSelector) {
              command += ` -l ${args.labelSelector}`;
            }

            const { stdout } = await execAsync(command);
            const pods = JSON.parse(stdout);

            return formatToolResponse({
              success: true,
              action: 'get_pods',
              namespace: args.allNamespaces ? 'all' : args.namespace || 'default',
              pods:
                pods.items?.map((pod: any) => ({
                  name: pod.metadata.name,
                  namespace: pod.metadata.namespace,
                  status: pod.status.phase,
                  restarts:
                    pod.status.containerStatuses?.reduce(
                      (sum: number, c: any) => sum + c.restartCount,
                      0
                    ) || 0,
                  ready: `${pod.status.containerStatuses?.filter((c: any) => c.ready).length || 0}/${pod.status.containerStatuses?.length || 0}`,
                  age: pod.metadata.creationTimestamp,
                  node: pod.spec.nodeName,
                })) || [],
            });
          }

          case 'describe_pod': {
            if (!args.name) {
              return formatToolResponse({ success: false, error: 'name parameter required' });
            }
            const { stdout } = await execAsync(
              `kubectl describe pod ${args.name} -n ${args.namespace || 'default'}`
            );

            return formatToolResponse({
              success: true,
              action: 'describe_pod',
              pod: args.name,
              namespace: args.namespace || 'default',
              description: stdout,
            });
          }

          case 'get_logs': {
            if (!args.name) {
              return formatToolResponse({ success: false, error: 'name parameter required' });
            }
            let command = `kubectl logs ${args.name} -n ${args.namespace || 'default'}`;
            if (args.container) command += ` -c ${args.container}`;
            if (args.tail) command += ` --tail=${args.tail}`;
            if (args.previous) command += ' --previous';

            const { stdout, stderr } = await execAsync(command);

            return formatToolResponse({
              success: true,
              action: 'get_logs',
              pod: args.name,
              namespace: args.namespace || 'default',
              container: args.container,
              logs: stdout,
              warnings: stderr || undefined,
            });
          }

          case 'get_deployments': {
            let command = 'kubectl get deployments -o json';
            if (args.allNamespaces) {
              command += ' --all-namespaces';
            } else {
              command += ` -n ${args.namespace || 'default'}`;
            }

            const { stdout } = await execAsync(command);
            const deployments = JSON.parse(stdout);

            return formatToolResponse({
              success: true,
              action: 'get_deployments',
              namespace: args.allNamespaces ? 'all' : args.namespace || 'default',
              deployments:
                deployments.items?.map((dep: any) => ({
                  name: dep.metadata.name,
                  namespace: dep.metadata.namespace,
                  replicas: `${dep.status.readyReplicas || 0}/${dep.spec.replicas}`,
                  upToDate: dep.status.updatedReplicas || 0,
                  available: dep.status.availableReplicas || 0,
                  age: dep.metadata.creationTimestamp,
                })) || [],
            });
          }

          case 'get_services': {
            let command = 'kubectl get services -o json';
            if (args.allNamespaces) {
              command += ' --all-namespaces';
            } else {
              command += ` -n ${args.namespace || 'default'}`;
            }

            const { stdout } = await execAsync(command);
            const services = JSON.parse(stdout);

            return formatToolResponse({
              success: true,
              action: 'get_services',
              namespace: args.allNamespaces ? 'all' : args.namespace || 'default',
              services:
                services.items?.map((svc: any) => ({
                  name: svc.metadata.name,
                  namespace: svc.metadata.namespace,
                  type: svc.spec.type,
                  clusterIP: svc.spec.clusterIP,
                  externalIP:
                    svc.status.loadBalancer?.ingress?.[0]?.ip ||
                    svc.spec.externalIPs?.[0] ||
                    'none',
                  ports: svc.spec.ports
                    ?.map((p: any) => `${p.port}:${p.targetPort}/${p.protocol}`)
                    .join(', '),
                  age: svc.metadata.creationTimestamp,
                })) || [],
            });
          }

          case 'get_events': {
            let command = `kubectl get events -n ${args.namespace || 'default'} -o json --sort-by='.lastTimestamp'`;
            if (args.fieldSelector) {
              command += ` --field-selector=${args.fieldSelector}`;
            }

            const { stdout } = await execAsync(command);
            const events = JSON.parse(stdout);

            return formatToolResponse({
              success: true,
              action: 'get_events',
              namespace: args.namespace || 'default',
              events:
                events.items?.map((evt: any) => ({
                  type: evt.type,
                  reason: evt.reason,
                  message: evt.message,
                  object: `${evt.involvedObject.kind}/${evt.involvedObject.name}`,
                  count: evt.count,
                  firstSeen: evt.firstTimestamp,
                  lastSeen: evt.lastTimestamp,
                })) || [],
            });
          }

          case 'get_resource_status': {
            if (!args.resourceType || !args.name) {
              return formatToolResponse({
                success: false,
                error: 'resourceType and name parameters required',
              });
            }
            const { stdout } = await execAsync(
              `kubectl get ${args.resourceType} ${args.name} -n ${args.namespace || 'default'} -o json`
            );

            const resource = JSON.parse(stdout);

            return formatToolResponse({
              success: true,
              action: 'get_resource_status',
              resourceType: args.resourceType,
              name: args.name,
              namespace: args.namespace || 'default',
              status: resource.status,
              metadata: {
                creationTimestamp: resource.metadata.creationTimestamp,
                labels: resource.metadata.labels,
                annotations: resource.metadata.annotations,
              },
            });
          }

          default:
            return formatToolResponse({
              success: false,
              error: `Unknown action: ${args.action}`,
            });
        }
      } catch (error: any) {
        return formatToolResponse({
          success: false,
          action: args.action,
          error: error.message,
        });
      }
    },
  },
];
