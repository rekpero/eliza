import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";
import { SpheronService } from "../service/spheron";

export const spheronWalletProvider: Provider = {
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
                wallet: spheronService,
                isAuthenticated: true,
                getBalance: spheronService.getBalance.bind(spheronService),
                getTransactionHistory:
                    spheronService.getTransactionHistory.bind(spheronService),
                getFormattedBalance: async () => {
                    const balance = await spheronService.getBalance();
                    return `Current Spheron Balance: ${balance}`;
                },
            };
        } catch (error: any) {
            return {
                wallet: null,
                isAuthenticated: false,
                error: error.message,
            };
        }
    },
};
