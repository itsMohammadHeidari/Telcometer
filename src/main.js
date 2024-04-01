import diam from 'k6/x/diameter';

let client = diam.Client({
    // Timeout for each request
    requestTimeout: "100ms",

    // Flag to enable automatic DWR (Diameter Watchdog Request)
    enableWatchdog: false,

    // List of authentication application IDs
    authApplicationId: [4],

    // List of vendor-specific application IDs
    vendorSpecificApplicationId: [
        {
            authApplicationId: 4,
            vendorId: 10415,
        }
    ],
    capabilityExchange: {
        vendorId: 35838,
        OriginHost: "epc.mnc020.mcc418.3gppnetwork.org"
    },
});