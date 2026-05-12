import client from "./client";

export const initiateCoffee = (data) => client.post("/coffee/initiate", data);
export const verifyCoffee = (reference) => client.post("/coffee/verify", { reference });