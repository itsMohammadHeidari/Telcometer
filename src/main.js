import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import diam from 'k6/x/diameter';
import { cfg } from './configs/config.js';
sleep(1);

let diamType = diam.DataType();

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

export const options = {
    // A boolean specifying whether k6 should reuse TCP connections
    noVUConnectionReuse: true,

    // A boolean specifying whether k6 should ignore TLS verifications for connections established from code
    insecureSkipTLSVerify: true,

    // A boolean specifying whether k6 should disable keep-alive connections
    noConnectionReuse: true,

    // Configure DNS resolution behavior
    dns: {
        ttl: '5m',
        select: 'random',
        policy: 'onlyIPv4',
    },

    // Specify whether response bodies should be discarded
    discardResponseBodies: true,

    // Specify which System Tags will be in the collected metrics
    systemTags: ['error', 'error_code', 'scenario', 'vu', 'iter'],

    // Define advanced execution scenarios
    scenarios: {
        scenario_dataInit: {
            exec: "initDataSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '0s',
            maxDuration: '10s',
        },
        scenario_voiceCallingCalledInit: {
            exec: "initVoiceCallingCalledSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '15s',
            maxDuration: '25s',
        },
        scenario_videoCallingInit: {
            exec: "initVideoCallingSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '20s',
            maxDuration: '30s',
        },
        scenario_dataUpdate: {
            exec: "updateDataSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 10,
            startTime: '60s',
            maxDuration: '600s',
        },
        scenario_voiceCallingCalledUpdate: {
            exec: "updateVoiceCallingCalledSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 10,
            startTime: '40s',
            maxDuration: '600s',
        },
        scenario_videoUpdate: {
            exec: "updateVideoCallingSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 10,
            startTime: '50s',
            maxDuration: '600s',
        },
        scenario_dataTerminate: {
            exec: "terminateDataSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '250s',
            maxDuration: '630s',
        },
        scenario_voiceCallingCalledTerminate: {
            exec: "terminateVoiceCallingCalledSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '260s',
            maxDuration: '632s',
        },
        scenario_videoCallingTerminate: {
            exec: "terminateVideoCallingSession",
            executor: 'per-vu-iterations',
            vus: cfg[0].get.numberOfAccounts,
            iterations: 1,
            startTime: '270s',
            maxDuration: '682s',
        },
    },
};

export const callingCalled = new SharedArray("an object represents who is calling and who is called", function () {
    let objCallingCalled = {};
    for (let i = 0; i <= cfg[0].get.numberOfAccounts; i++) {
        objCallingCalled[i.toString()] = userData[0].get.zz + (cfg[0].get.numberOfAccounts - i + 1).toString();
    }
    return [objCallingCalled];
});

export const IMEISVs = new SharedArray("an array containing IMEISV for accounts", function () {
    let imeisvs = [];

    for (let i = 0; i < cfg[0].get.numberOfAccounts; i++) {
        imeisvs.push(parseInt(cfg[0].get.TAC +
            Math.floor(Math.random() * (999999 - 111111 + 1) + 111111).toString() +
            Math.floor(Math.random() * (98 - 11 + 1) + 11).toString()));
    }
    return imeisvs;
});