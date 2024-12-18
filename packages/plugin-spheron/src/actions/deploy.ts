import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    composeContext,
    generateObjectV2,
    ModelClass,
    elizaLogger,
    ServiceType,
} from "@ai16z/eliza";
import { createArrayCsvWriter } from "csv-writer";
import * as path from "path";
import * as fs from "fs";
import { SpheronService } from "../service/spheron";
import { generateSpheronYaml } from "../utils/common";

// Schema for deployment content
const DeploymentSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        description: { type: "string" },
        personality: { type: "string" },
        capabilities: { type: "array", items: { type: "string" } },
        shouldDeploy: { type: "boolean" },
        deploymentReason: { type: "string" },
    },
    required: [
        "name",
        "description",
        "personality",
        "capabilities",
        "shouldDeploy",
        "deploymentReason",
    ],
};

const isDeploymentContent = (content: any): content is DeploymentContent => {
    return (
        typeof content.name === "string" &&
        typeof content.description === "string" &&
        typeof content.personality === "string" &&
        Array.isArray(content.capabilities) &&
        typeof content.shouldDeploy === "boolean" &&
        typeof content.deploymentReason === "string"
    );
};

const deploymentTemplate = `Analyze the following social media content and determine if an AI agent should be deployed. Consider:
1. User's needs and requirements
2. Potential use cases
3. Required capabilities
4. Deployment urgency

Example response:
\`\`\`json
{
    "name": "SocialAnalystBot",
    "description": "AI agent for social media trend analysis",
    "personality": "Professional and analytical",
    "capabilities": ["trend analysis", "sentiment analysis", "report generation"],
    "shouldDeploy": true,
    "deploymentReason": "High demand for real-time social media analysis"
}
\`\`\`

{{recentMessages}}

Extract deployment requirements and determine if an agent should be deployed. Respond with a JSON markdown block.`;

export const deployAction: Action = {
    name: "DEPLOY_AGENT",
    description:
        "Analyze social media content and deploy an AI agent if needed",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        return !!runtime.getSetting("SPHERON_PRIVATE_KEY");
    },
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback: HandlerCallback
    ) => {
        try {
            // Get or initialize SpheronService
            const spheronService = runtime.getService<ServiceType>(
                ServiceType.CUSTOM
            );
            if (!spheronService) {
                const service = new SpheronService();
                await service.initialize(runtime);
                runtime.services.set(ServiceType.CUSTOM, service);
            }

            // Generate deployment requirements
            const context = composeContext({
                state,
                template: deploymentTemplate,
            });

            const deploymentDetails = await generateObjectV2({
                runtime,
                context,
                modelClass: ModelClass.MEDIUM,
                schema: DeploymentSchema,
            });

            if (!isDeploymentContent(deploymentDetails.object)) {
                callback(
                    { text: "Invalid deployment configuration generated." },
                    []
                );
                return;
            }

            const agentConfig = deploymentDetails.object;

            if (!agentConfig.shouldDeploy) {
                callback(
                    {
                        text: `Deployment not recommended at this time.\nReason: ${agentConfig.deploymentReason}`,
                    },
                    []
                );
                return;
            }

            // Generate Dockerfile and Spheron YAML
            const spheronYaml = generateSpheronYaml(agentConfig);

            // Write files
            const deploymentDir = path.join(
                process.cwd(),
                "deployments",
                agentConfig.name.toLowerCase()
            );
            fs.mkdirSync(deploymentDir, { recursive: true });
            fs.writeFileSync(
                path.join(deploymentDir, "Dockerfile"),
                dockerfile
            );
            fs.writeFileSync(
                path.join(deploymentDir, "spheron.yaml"),
                spheronYaml
            );

            // Deploy using SpheronService
            const deployment =
                await spheronService.createDeployment(spheronYaml);

            // Log deployment
            const deploymentsLog = path.join(process.cwd(), "deployments.csv");
            const csvWriter = createArrayCsvWriter({
                path: deploymentsLog,
                header: [
                    "Agent Name",
                    "Description",
                    "Deployment ID",
                    "Timestamp",
                    "Status",
                ],
                append: true,
            });

            await csvWriter.writeRecords([
                [
                    agentConfig.name,
                    agentConfig.description,
                    deployment.id,
                    new Date().toISOString(),
                    deployment.status,
                ],
            ]);

            callback(
                {
                    text: `Agent deployment initiated successfully:
- Name: ${agentConfig.name}
- Description: ${agentConfig.description}
- Deployment ID: ${deployment.id}
- Status: ${deployment.status}
- Capabilities: ${agentConfig.capabilities.join(", ")}

Deployment has been logged to deployments.csv.
You can monitor the deployment status using the Spheron service.`,
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error in deployment action:", error);
            callback(
                { text: "Failed to deploy agent. Please check the logs." },
                []
            );
        }
    },
};
