import { SpheronSDK } from "@spheron/protocol-sdk";
import { Service, ServiceType, IAgentRuntime } from "@ai16z/eliza";

export interface ISpheronService {
    getDeployment(deploymentId: string): Promise<any>;
    getDeploymentStatus(deploymentId: string): Promise<string>;
    getDeploymentLogs(deploymentId: string): Promise<any>;
    createDeployment(manifest: string): Promise<any>;
    getBalance(): Promise<string>;
    deposit(amount: string): Promise<any>;
    withdraw(amount: string): Promise<any>;
    getTransactionHistory(): Promise<any>;
    updateDeployment(deploymentId: string, manifest: string): Promise<any>;
    closeDeployment(deploymentId: string): Promise<any>;
    getDeploymentRemainingTime(deploymentId: string): Promise<number>;
}

export class SpheronService extends Service implements ISpheronService {
    static serviceType: ServiceType = ServiceType.CUSTOM;

    private sdk: SpheronSDK | null = null;
    private providerProxyUrl: string = "";
    private runtime: IAgentRuntime | null = null;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        this.runtime = runtime;
        const privateKey = runtime.getSetting("SPHERON_PRIVATE_KEY");
        const network = runtime.getSetting("SPHERON_NETWORK") || "testnet";
        this.providerProxyUrl =
            runtime.getSetting("SPHERON_PROVIDER_PROXY_URL") ||
            "http://localhost:3040";

        if (!privateKey) {
            throw new Error("SPHERON_PRIVATE_KEY not found in settings");
        }

        this.sdk = new SpheronSDK(network, privateKey);
    }

    private ensureInitialized(): void {
        if (!this.sdk || !this.runtime) {
            throw new Error("SpheronService not properly initialized");
        }
    }

    // Deployment Methods
    async getDeployment(deploymentId: string): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.deployment.getDeployment(deploymentId);
        } catch (error: any) {
            throw new Error(`Failed to get deployment: ${error.message}`);
        }
    }

    async getDeploymentStatus(deploymentId: string): Promise<string> {
        this.ensureInitialized();
        try {
            const deployment = await this.getDeployment(deploymentId);
            return deployment.status;
        } catch (error: any) {
            throw new Error(
                `Failed to get deployment status: ${error.message}`
            );
        }
    }

    async getDeploymentLogs(deploymentId: string): Promise<any> {
        this.ensureInitialized();
        try {
            const deployment = await this.getDeployment(deploymentId);
            return deployment.logs;
        } catch (error: any) {
            throw new Error(`Failed to get deployment logs: ${error.message}`);
        }
    }

    async createDeployment(manifest: string): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.deployment.createDeployment(
                manifest,
                this.providerProxyUrl
            );
        } catch (error: any) {
            throw new Error(`Failed to create deployment: ${error.message}`);
        }
    }

    // Wallet Methods
    async getBalance(): Promise<string> {
        this.ensureInitialized();
        try {
            return await this.sdk!.escrow.getBalance();
        } catch (error: any) {
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    async deposit(amount: string): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.escrow.deposit(amount);
        } catch (error: any) {
            throw new Error(`Failed to deposit: ${error.message}`);
        }
    }

    async withdraw(amount: string): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.escrow.withdraw(amount);
        } catch (error: any) {
            throw new Error(`Failed to withdraw: ${error.message}`);
        }
    }

    async getTransactionHistory(): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.escrow.getTransactionHistory();
        } catch (error: any) {
            throw new Error(
                `Failed to get transaction history: ${error.message}`
            );
        }
    }

    // New Deployment Methods
    async updateDeployment(
        deploymentId: string,
        manifest: string
    ): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.deployment.updateDeployment(
                deploymentId,
                manifest,
                this.providerProxyUrl
            );
        } catch (error: any) {
            throw new Error(`Failed to update deployment: ${error.message}`);
        }
    }

    async closeDeployment(deploymentId: string): Promise<any> {
        this.ensureInitialized();
        try {
            return await this.sdk!.deployment.closeDeployment(deploymentId);
        } catch (error: any) {
            throw new Error(`Failed to close deployment: ${error.message}`);
        }
    }

    async getDeploymentRemainingTime(deploymentId: string): Promise<number> {
        this.ensureInitialized();
        try {
            const deployment = await this.getDeployment(deploymentId);
            const leaseDetails = await this.sdk!.leases.getLeaseDetails(
                deployment.leaseId
            );

            const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
            const endTime = leaseDetails.endTime || 0;

            // Return 0 if deployment has ended
            return Math.max(0, endTime - currentTime);
        } catch (error: any) {
            throw new Error(
                `Failed to get deployment remaining time: ${error.message}`
            );
        }
    }
}

export default SpheronService;
