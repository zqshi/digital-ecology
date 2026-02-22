import { startRuntimeGatewayServer } from "./server";

startRuntimeGatewayServer(Number(process.env.PORT || 8082));
