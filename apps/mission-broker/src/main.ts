import { startMissionBrokerServer } from "./api/server";

startMissionBrokerServer(Number(process.env.PORT || 8081));
