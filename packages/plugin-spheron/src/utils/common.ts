interface DeploymentContent {
    name: string;
    description: string;
    personality: string;
    capabilities: string[];
    shouldDeploy: boolean;
    deploymentReason: string;
}

const generateSpheronYaml = (agentConfig: DeploymentContent): string => {
    return `version: "1.0"

services:
  ${agentConfig.name.toLowerCase()}:
    image: ${agentConfig.name.toLowerCase()}:latest
    pull_policy: Always
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
    env:
      - AGENT_NAME=${agentConfig.name}
      - AGENT_DESCRIPTION=${agentConfig.description}

profiles:
  name: ${agentConfig.name.toLowerCase()}
  duration: 24h
  mode: provider
  tier:
    - community
    - secure
  compute:
    ${agentConfig.name.toLowerCase()}:
      resources:
        cpu:
          units: 4
        memory:
          size: 8Gi
        storage:
          - size: 50Gi
  placement:
    attributes:
      region: us-central

deployment:
  ${agentConfig.name.toLowerCase()}:
    westcoast:
      profile: ${agentConfig.name.toLowerCase()}
      count: 1`;
};

export { generateSpheronYaml };
