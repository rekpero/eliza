import {
    Action,
    IAgentRuntime,
    Memory,
    HandlerCallback,
    State,
    ServiceType,
    elizaLogger,
} from "@ai16z/eliza";
import { SpheronService } from "../service/spheron";
import { generateSpheronYaml } from "../utils/common";

const DEPLOYMENT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const REDEPLOY_THRESHOLD = 10 * 60; // 10 minutes in seconds

export const perpetualDeploymentAction: Action = {
    name: "PERPETUAL_DEPLOYMENT",
    description:
        "Maintains continuous deployment by monitoring and redeploying before expiration",
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
            let spheronService = runtime.getService<ServiceType>(
                ServiceType.CUSTOM
            );
            if (!spheronService) {
                spheronService = new SpheronService();
                await spheronService.initialize(runtime);
                runtime.services.set(ServiceType.CUSTOM, spheronService);
            }

            // Start periodic check
            const checkDeployment = async () => {
                try {
                    const deploymentInfo =
                        await spheronService.getDeploymentInfo();
                    const remainingTime = deploymentInfo.remainingTime; // in seconds

                    if (remainingTime <= REDEPLOY_THRESHOLD) {
                        elizaLogger.info(
                            `Deployment expiring soon (${remainingTime}s remaining). Initiating redeployment...`
                        );

                        // Get current deployment config
                        const currentConfig =
                            await spheronService.getCurrentConfig();

                        // Generate fresh YAML with same configuration
                        const spheronYaml = generateSpheronYaml(currentConfig);

                        // Create new deployment
                        const newDeployment =
                            await spheronService.createDeployment(spheronYaml);

                        elizaLogger.info(
                            `Redeployment initiated successfully. New deployment ID: ${newDeployment.id}`
                        );
                    }
                } catch (error) {
                    elizaLogger.error(
                        "Error checking deployment status:",
                        error
                    );
                }
            };

            // Initial check
            await checkDeployment();

            // Set up periodic checks
            const intervalId = setInterval(
                checkDeployment,
                DEPLOYMENT_CHECK_INTERVAL
            );

            // Store interval ID in runtime for cleanup
            runtime.setState("perpetualDeploymentInterval", intervalId);

            callback(
                {
                    text: "Perpetual deployment monitoring started. Will check every 5 minutes and redeploy when less than 10 minutes remaining.",
                },
                []
            );
        } catch (error) {
            elizaLogger.error("Error in perpetual deployment action:", error);
            callback(
                {
                    text: "Failed to start perpetual deployment monitoring. Please check the logs.",
                },
                []
            );
        }
    },
};
