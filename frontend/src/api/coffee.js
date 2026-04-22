import api from "./auth";

export const initiateCoffee = (data) => api.post("/coffee/initiate", data);
export const verifyCoffee = (reference) => api.post("/coffee/verify", { reference });