import { Plugin } from "@ai16z/eliza";
import { spheronDeploymentProvider } from "./providers/deployment";
import { spheronWalletProvider } from "./providers/wallet";
import { SpheronService } from "./service/spheron";

export const spheronPlugin: Plugin = {
    name: "spheron",
    description: "Spheron Protocol Plugin for Eliza",
    providers: [spheronDeploymentProvider, spheronWalletProvider],
    actions: [],
    evaluators: [],
    services: [new SpheronService()],
};

export default spheronPlugin;
