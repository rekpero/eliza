import { Plugin } from "@ai16z/eliza";
import { spheronDeploymentProvider } from "./providers/deployment";
import { spheronWalletProvider } from "./providers/wallet";
import { SpheronService } from "./service/spheron";
import { agentDeployAction } from "./actions/agent-deploy";
import { perpetualDeploymentAction } from "./actions/perpetual-deployment";

export const spheronPlugin: Plugin = {
    name: "spheron",
    description: "Spheron Protocol Plugin for Eliza",
    providers: [spheronDeploymentProvider, spheronWalletProvider],
    actions: [agentDeployAction, perpetualDeploymentAction],
    evaluators: [],
    services: [new SpheronService()],
};

export default spheronPlugin;
