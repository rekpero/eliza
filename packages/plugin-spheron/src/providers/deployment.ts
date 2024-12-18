import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { SpheronService } from "../service/spheron";

export const spheronDeploymentProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<any> {
        try {
            // Initialize the Spheron service
            const spheronService = new SpheronService();
            await spheronService.initialize(runtime);

            return {
                deployment: spheronService,
                isAuthenticated: true,
                getDeployment:
                    spheronService.getDeployment.bind(spheronService),
                getDeploymentStatus:
                    spheronService.getDeploymentStatus.bind(spheronService),
                getDeploymentLogs:
                    spheronService.getDeploymentLogs.bind(spheronService),
            };
        } catch (error: any) {
            return {
                deployment: null,
                isAuthenticated: false,
                error: error.message,
            };
        }
    },
};
