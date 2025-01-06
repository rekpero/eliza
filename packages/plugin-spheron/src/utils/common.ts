interface DeploymentConfig {
    name: string;
    image: string;
    replicas?: number;
    ports?: Array<{
        containerPort: number;
        servicePort: number;
    }>;
    env?: Array<{
        name: string;
        value: string;
    }>;
    computeResources?: {
        cpu: number;
        memory: string;
        storage: string;
    };
    duration?: string; // 30min, 1h, 2h, 4h, 8h, 12h, 24h, 1d, 1mon
}

const generateSpheronYaml = (config: DeploymentConfig): string => {
    const yaml = `version: "1.0"

services:
  ${config.name}:
    image: ${config.image}
    ${
        config.ports
            ? `expose:
      ${config.ports
          .map(
              (p) => `- port: ${p.containerPort}
        as: ${p.servicePort}
        to:
          - global: true`
          )
          .join("\n      ")}`
            : ""
    }
    ${
        config.env
            ? `env:
      ${config.env.map((e) => `- ${e.name}=${e.value}`).join("\n      ")}`
            : ""
    }

profiles:
  name: ${config.name}
  duration: ${config.duration || "24h"}
  mode: provider
  tier:
    - community
    - secure
  compute:
    ${config.name}:
      resources:
        cpu:
          units: ${config.computeResources?.cpu || 2}
        memory:
          size: ${config.computeResources?.memory || "2Gi"}
        storage:
          - size: ${config.computeResources?.storage || "10Gi"}
  placement:
    westcoast:
      pricing:
        ${config.name}:
          token: USDT
          amount: 0.1

deployment:
  ${config.name}:
    westcoast:
      profile: ${config.name}
      count: ${config.replicas || 1}`;

    return yaml.trim();
};

export { generateSpheronYaml, DeploymentConfig };
