import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import diam from 'k6/x/diameter';
import http from 'k6/http';
import avp from 'k6/x/diameter/avp';
import { cfg } from './configs/config.js';
import { cmd, app, vendor, flag, code, userData } from './common/data.js';

const diamType = diam.DataType();

const client = diam.Client({
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
        OriginHost: "epc.mnc020.mcc418.3gppnetwork.org",
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
        select: 'first',
        policy: 'onlyIPv4',
    },

    // Specify whether response bodies should be discarded
    discardResponseBodies: false,

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

export function setup() {
    for (let i = 0; i < cfg[0].get.numberOfAccounts; i++) {
        http.post(cfg[0].get.webdis_url, `LPUSH/data_init_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/voice_calling_init_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/voice_called_init_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/video_calling_init_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/data_terminate_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/voice_calling_terminate_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/voice_called_terminate_sessionIds/${i}`);
        http.post(cfg[0].get.webdis_url, `LPUSH/video_calling_terminate_sessionIds/${i}`);
    }

    for (let iter = 0; iter < cfg[0].get.dataUpdateSenderIterations; iter++) {
        for (let i = 0; i < cfg[0].get.numberOfAccounts; i++) {
            http.post(cfg[0].get.webdis_url, `LPUSH/data_update_sessionIds/${i}`);
        }
    }

    for (let iter = 0; iter < cfg[0].get.voiceCallingCalledUpdateSenderIterations; iter++) {
        for (let i = 0; i < cfg[0].get.numberOfAccounts; i++) {
            http.post(cfg[0].get.webdis_url, `LPUSH/voice_calling_update_sessionIds/${i}`);
            http.post(cfg[0].get.webdis_url, `LPUSH/voice_called_update_sessionIds/${i}`);
        }
    }

    for (let iter = 0; iter < cfg[0].get.videoUpdateSenderIterations; iter++) {
        for (let i = 0; i < cfg[0].get.numberOfAccounts; i++) {
            http.post(cfg[0].get.webdis_url, `LPUSH/video_calling_update_sessionIds/${i}`);
        }
    }
}

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

function dataInit(sessionID, phoneNumber) {

    let data_init_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);
    data_init_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    data_init_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_init_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_init_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_init_session_ccr.add(avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Unsigned32(4)))
    data_init_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("32251@3gpp.org")))
    data_init_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(1)))
    data_init_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    data_init_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    data_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumber))
    ])))
    data_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(1)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`${userData[0].get.preMiddleFix}${phoneNumber}`))
    ])))
    data_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumber))
    ])))
    data_init_session_ccr.add(avp.New(code[0].get.RequestedAction, 0, flag[0].get.M, diamType.Enumerated(0)))
    data_init_session_ccr.add(avp.New(code[0].get.AoCRequestType, vendor[0].get.TGPP, (flag[0].get.V) | (flag[0].get.M), diamType.Enumerated(1)))
    data_init_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(0)))
    data_init_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.UTF8String("")),
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(0)),
            avp.New(code[0].get.CCInputOctets, 0, flag[0].get.M, diamType.Unsigned64(0)),
            avp.New(code[0].get.CCOutputOctets, 0, flag[0].get.M, diamType.Unsigned64(0))
        ])),
        avp.New(code[0].get.QoSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.QoSClassIdentifier, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(5)),
            avp.New(code[0].get.AllocationRetentionPriority, vendor[0].get.TGPP, flag[0].get.V, diamType.Grouped([
                avp.New(code[0].get.PriorityLevel, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1)),
                avp.New(code[0].get.PreemptionCapability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1)),
                avp.New(code[0].get.PreemptionVulnerability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1))
            ])),
            avp.New(code[0].get.APNAggregateMaxBitrateUL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateUL)),
            avp.New(code[0].get.APNAggregateMaxBitrateDL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateDL))
        ])),
        avp.New(code[0].get.TGPPRATType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("06"))
    ])))
    data_init_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.PSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.TGPPChargingId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("0000000a")),
            avp.New(code[0].get.TGPPPDPType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.PDPAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("10.46.0.2")),
            avp.New(code[0].get.SGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.3")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),
            avp.New(code[0].get.CalledStationId, 0, flag[0].get.M, diamType.UTF8String("internet")),
            avp.New(code[0].get.TGPPSelectionMode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("0")),
            avp.New(code[0].get.TGPPSGSNMCCMNC, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(userData[0].get.prefix)),
            avp.New(code[0].get.TGPPNSAPI, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("\\005")),
            avp.New(code[0].get.TGPPMSTimeZone, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString(userData[0].get.timeZone)),
            avp.New(code[0].get.TGPPUserLocationInfo, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(userData[0].get.userLocationInfo)),
            avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
                avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
            ]))
        ]))
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(data_init_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function voiceCallingInit(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_calling_init_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_calling_init_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.DestinationHost, 0, flag[0].get.M, diamType.DiameterIdentity("hssocs.voiceblue.com")))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(2)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("INVITE")),
                avp.New(code[0].get.Expires, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(4294967295)),
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String(`3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b`)),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_calling_init_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100)),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_calling_init_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function voiceCalledInit(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_called_init_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_called_init_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(2)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_called_init_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("INVITE")),
                avp.New(code[0].get.Expires, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(4294967295)),
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(1)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
            ])),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_called_init_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_called_init_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_called_init_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_called_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
    ])))
    voice_called_init_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_called_init_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100)),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_called_init_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function videoCallingInit(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let video_calling_init_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    video_calling_init_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(2)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    video_calling_init_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("INVITE")),
                avp.New(code[0].get.Expires, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(4294967295)),
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String(`3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b`)),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    video_calling_init_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    video_calling_init_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(1)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    video_calling_init_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    video_calling_init_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    video_calling_init_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    video_calling_init_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.videoRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1001)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(200)),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(video_calling_init_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function dataUpdate(sessionID, phoneNumber) {

    let data_update_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    data_update_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    data_update_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_update_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_update_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_update_session_ccr.add(avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Unsigned32(4)))
    data_update_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("32251@3gpp.org")))
    data_update_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(2)))
    data_update_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(1)))
    data_update_session_ccr.add(avp.New(code[0].get.DestinationHost, 0, flag[0].get.M, diamType.DiameterIdentity(`CGR-DA.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_update_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    data_update_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(1)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`${userData[0].get.preMiddleFix}${phoneNumber}`))
    ])))
    data_update_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumber))
    ])))
    data_update_session_ccr.add(avp.New(code[0].get.RequestedAction, 0, flag[0].get.M, diamType.Enumerated(0)))
    data_update_session_ccr.add(avp.New(code[0].get.AoCRequestType, vendor[0].get.TGPP, (flag[0].get.V) | (flag[0].get.M), diamType.Enumerated(1)))
    data_update_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.UTF8String("")),
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.ReportingReason, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(3)),
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(0)),
            avp.New(code[0].get.CCInputOctets, 0, flag[0].get.M, diamType.Unsigned64(cfg[0].get.downloadedBytes)),
            avp.New(code[0].get.CCOutputOctets, 0, flag[0].get.M, diamType.Unsigned64(cfg[0].get.uploadedBytes))
        ])),
        avp.New(code[0].get.QoSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.QoSClassIdentifier, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(9)),
            avp.New(code[0].get.AllocationRetentionPriority, vendor[0].get.TGPP, flag[0].get.V, diamType.Grouped([
                avp.New(code[0].get.PriorityLevel, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(8)),
                avp.New(code[0].get.PreemptionCapability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1)),
                avp.New(code[0].get.PreemptionVulnerability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1))
            ])),
            avp.New(code[0].get.APNAggregateMaxBitrateUL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateUL)),
            avp.New(code[0].get.APNAggregateMaxBitrateDL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateDL))
        ])),
        avp.New(code[0].get.TGPPRATType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("06"))
    ])))
    data_update_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.PSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.TGPPChargingId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("00000014")),
            avp.New(code[0].get.PDPAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("10.46.0.8")),
            avp.New(code[0].get.SGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.3")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),
            avp.New(code[0].get.CalledStationId, 0, flag[0].get.M, diamType.UTF8String("internet")),
            avp.New(code[0].get.TGPPSelectionMode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("0")),
            avp.New(code[0].get.TGPPSGSNMCCMNC, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(userData[0].get.prefix)),
            avp.New(code[0].get.TGPPNSAPI, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("\\006")),
            avp.New(code[0].get.TGPPMSTimeZone, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString(userData[0].get.timeZone)),
            avp.New(code[0].get.TGPPUserLocationInfo, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(userData[0].get.userLocationInfo)),
            avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
                avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID])),
            ]))
        ]))
    ])))

    // console.log("this is data_update_session_ccr: ", data_update_session_ccr)

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(data_update_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function voiceCallingUpdate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_calling_update_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_calling_update_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(3)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String(`3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b`)),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(2)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(3)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_calling_update_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100)),
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceCallUsedTime))
        ])),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_calling_update_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function voiceCalledUpdate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_called_update_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_called_update_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(3)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_called_update_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy"))
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(1)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0))
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String(`3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b`)),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_called_update_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_called_update_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(2)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(2)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_called_update_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_called_update_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
    ])))
    voice_called_update_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_called_update_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100)),
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceCallUsedTime))
        ])),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_called_update_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function videoCallingUpdate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let video_calling_update_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    video_calling_update_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(3)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    video_calling_update_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String("3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b")),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    video_calling_update_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    video_calling_update_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(2)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(1)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    video_calling_update_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    video_calling_update_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    video_calling_update_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    video_calling_update_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.RequestedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.videoRequestedTime))
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1001)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(200)),
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.videoUsedTime))
        ])),
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(video_calling_update_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function dataTerminate(sessionID, phoneNumber) {

    let data_terminate_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    data_terminate_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    data_terminate_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.DiameterIdentity(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_terminate_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_terminate_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.DiameterIdentity(`epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_terminate_session_ccr.add(avp.New(code[0].get.DestinationHost, 0, flag[0].get.M, diamType.DiameterIdentity(`CGR-DA.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    data_terminate_session_ccr.add(avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Unsigned32(4)))
    data_terminate_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("32251@3gpp.org")))
    data_terminate_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(3)))
    data_terminate_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(1)))
    data_terminate_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    data_terminate_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(1)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`${userData[0].get.preMiddleFix}${phoneNumber}`))
    ])))
    data_terminate_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumber))
    ])))
    data_terminate_session_ccr.add(avp.New(code[0].get.TerminationCause, 0, flag[0].get.M, diamType.Enumerated(1)))
    data_terminate_session_ccr.add(avp.New(code[0].get.RequestedAction, 0, flag[0].get.M, diamType.Enumerated(0)))
    data_terminate_session_ccr.add(avp.New(code[0].get.AoCRequestType, vendor[0].get.TGPP, (flag[0].get.V) | (flag[0].get.M), diamType.Enumerated(1)))
    data_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(0)),
            avp.New(code[0].get.CCInputOctets, 0, flag[0].get.M, diamType.Unsigned64(cfg[0].get.downloadedBytes)),
            avp.New(code[0].get.CCOutputOctets, 0, flag[0].get.M, diamType.Unsigned64(cfg[0].get.uploadedBytes))
        ])),
        avp.New(code[0].get.ReportingReason, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.QoSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.QoSClassIdentifier, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(9)),
            avp.New(code[0].get.AllocationRetentionPriority, vendor[0].get.TGPP, flag[0].get.V, diamType.Grouped([
                avp.New(code[0].get.PriorityLevel, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(8)),
                avp.New(code[0].get.PreemptionCapability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1)),
                avp.New(code[0].get.PreemptionVulnerability, vendor[0].get.TGPP, flag[0].get.V, diamType.Enumerated(1))
            ])),
            avp.New(code[0].get.APNAggregateMaxBitrateUL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateUL)),
            avp.New(code[0].get.APNAggregateMaxBitrateDL, vendor[0].get.TGPP, flag[0].get.V, diamType.Unsigned32(cfg[0].get.BitrateDL))
        ])),
        avp.New(code[0].get.TGPPRATType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("06")),
    ])))
    data_terminate_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.PSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.TGPPChargingId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString("0000000b")),
            avp.New(code[0].get.PDPAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("10.45.0.3")),
            avp.New(code[0].get.SGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.3")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),
            avp.New(code[0].get.GGSNAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Address("127.0.0.4")),

            avp.New(code[0].get.CalledStationId, 0, flag[0].get.M, diamType.UTF8String("internet")),
            avp.New(code[0].get.TGPPSelectionMode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("0")),
            avp.New(code[0].get.TGPPSGSNMCCMNC, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`${cfg[0].get.MCC}20`)),
            avp.New(code[0].get.TGPPNSAPI, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("\\005")),
            avp.New(code[0].get.TGPPMSTimeZone, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.OctetString(userData[0].get.timeZone)),
            avp.New(code[0].get.TGPPUserLocationInfo, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(userData[0].get.userLocationInfo)),
            avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
                avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
            ]))
        ]))
    ])))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(data_terminate_session_ccr);

    // console.log(`CCA: ${cca}`)

}

function voiceCallingTerminate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_calling_terminate_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.UTF8String(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(4)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy"))
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0))
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String(`3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b`)),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(3)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(9)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.voiceCallUsedTime)),
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100))
    ])))
    voice_calling_terminate_session_ccr.add(avp.New(code[0].get.TerminationCause, 0, flag[0].get.M, diamType.Enumerated(1)))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_calling_terminate_session_ccr);

    // console.log(`CCA: ${cca}`)
}

function voiceCalledTerminate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let voice_called_terminate_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    voice_called_terminate_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.UTF8String(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(4)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy"))
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(1)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0))
            ])),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(3)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(9)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(phoneNumberCalled))
    ])))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.usedTime)),
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1000)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(100))
    ])))
    voice_called_terminate_session_ccr.add(avp.New(code[0].get.TerminationCause, 0, flag[0].get.M, diamType.Enumerated(1)))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(voice_called_terminate_session_ccr);

    // console.log(`CCA: ${cca}`);
}

function videoCallingTerminate(sessionID, phoneNumberCalling, phoneNumberCalled) {

    let video_calling_terminate_session_ccr = diam.newMessage(cmd[0].get.CreditControl, app[0].get.ChargingControl);

    video_calling_terminate_session_ccr.add(avp.New(code[0].get.SessionId, 0, flag[0].get.M, diamType.UTF8String(`smf.epc.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org;${sessionID};${sessionID}`)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.OriginHost, 0, flag[0].get.M, diamType.UTF8String(`scscf.ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.OriginRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.DestinationRealm, 0, flag[0].get.M, diamType.UTF8String(`ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordType, 0, flag[0].get.M, diamType.Enumerated(4)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.AccountingRecordNumber, 0, flag[0].get.M, diamType.Unsigned32(0)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.UserName, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.ServiceContextId, 0, flag[0].get.M, diamType.UTF8String("ext.02.001.8.32260@3gpp.org")))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.ServiceInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
            avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
        ])),
        avp.New(code[0].get.IMSInformation, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.EventType, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPMethod, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy")),
                avp.New(code[0].get.Event, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("dummy"))
            ])),
            avp.New(code[0].get.RoleOfNode, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.NodeFunctionality, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Enumerated(0)),
            avp.New(code[0].get.UserSessionId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String("tTOM6k7fswFpIZDJ3qy90g..@10.46.0.3")),
            avp.New(code[0].get.CallingPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`)),
            avp.New(code[0].get.CalledPartyAddress, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.UTF8String(`tel:${phoneNumberCalled}`)),
            avp.New(code[0].get.TrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.OutgoingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0)),
                avp.New(code[0].get.IncomingTrunkGroupId, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Unsigned32(0))
            ])),
            avp.New(code[0].get.AccessNetworkInformation, vendor[0].get.TGPP, flag[0].get.V, diamType.UTF8String("3GPP-E-UTRAN-FDD;utran-cell-id-3gpp=${cfg[0].get.MCC}200001000010b")),
            avp.New(code[0].get.TimeStamps, vendor[0].get.TGPP, flag[0].get.V | flag[0].get.M, diamType.Grouped([
                avp.New(code[0].get.SIPRequestTimestamp, vendor[0].get.TGPP, flag[0].get.V, diamType.Time(new Date(Date.now())))
            ]))
        ]))
    ])))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.VendorSpecificApplicationId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.VendorId, 0, flag[0].get.M, diamType.Unsigned32(10415)),
        avp.New(code[0].get.AuthApplicationId, 0, flag[0].get.M, diamType.Enumerated(4)),
    ])))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.CCRequestType, 0, flag[0].get.M, diamType.Enumerated(3)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.CCRequestNumber, 0, flag[0].get.M, diamType.Unsigned32(9)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.EventTimestamp, 0, flag[0].get.M, diamType.Time(new Date(Date.now()))))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.UserEquipmentInfo, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UserEquipmentInfoType, 0, flag[0].get.M, diamType.Enumerated(0)),
        avp.New(code[0].get.UserEquipmentInfoValue, 0, flag[0].get.M, diamType.OctetString(IMEISVs[sessionID]))
    ])))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.SubscriptionId, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.SubscriptionIdType, 0, flag[0].get.M, diamType.Enumerated(2)),
        avp.New(code[0].get.SubscriptionIdData, 0, flag[0].get.M, diamType.UTF8String(`sip:${phoneNumberCalling}@ims.mnc${cfg[0].get.MNC}.mcc${cfg[0].get.MCC}.3gppnetwork.org`))
    ])))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesIndicator, 0, flag[0].get.M, diamType.Enumerated(1)))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.MultipleServicesCreditControl, 0, flag[0].get.M, diamType.Grouped([
        avp.New(code[0].get.UsedServiceUnit, 0, flag[0].get.M, diamType.Grouped([
            avp.New(code[0].get.CCTime, 0, flag[0].get.M, diamType.Unsigned32(cfg[0].get.videoUsedTime)),
        ])),
        avp.New(code[0].get.ServiceIdentifier, 0, flag[0].get.M, diamType.Unsigned32(1001)),
        avp.New(code[0].get.RatingGroup, 0, flag[0].get.M, diamType.Unsigned32(200))
    ])))
    video_calling_terminate_session_ccr.add(avp.New(code[0].get.TerminationCause, 0, flag[0].get.M, diamType.Enumerated(1)))

    client.connect(cfg[0].get.diamClient)

    let cca = client.send(video_calling_terminate_session_ccr);

    // console.log(`CCA: ${cca}`)
}

export function initDataSession() {
    let res = http.get(`${cfg[0].get.webdis_url}LPOP/data_init_sessionIds`)
    let sessionID = JSON.parse(res.body)['LPOP'];
    let phoneNumber = userData[0].get.zz + sessionID.toString();
    dataInit("1" + sessionID, phoneNumber);
}

export function initVoiceCallingCalledSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/voice_calling_init_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let resCalled = http.get(`${cfg[0].get.webdis_url}LPOP/voice_called_init_sessionIds`)
    let calledSessionID = JSON.parse(resCalled.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    voiceCallingInit("2" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
    voiceCalledInit("3" + calledSessionID, phoneNumberCalling, phoneNumberCalled);
}

export function initVideoCallingSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/video_calling_init_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    videoCallingInit("4" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
}

export function updateDataSession() {
    let res = http.get(`${cfg[0].get.webdis_url}LPOP/data_update_sessionIds`)
    let sessionID = JSON.parse(res.body)['LPOP'];
    let phoneNumber = userData[0].get.zz + sessionID.toString();
    dataUpdate("1" + sessionID, phoneNumber);
    sleep(cfg[0].get.dataRequestedTime);
}

export function updateVoiceCallingCalledSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/voice_calling_update_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let resCalled = http.get(`${cfg[0].get.webdis_url}LPOP/voice_called_update_sessionIds`)
    let calledSessionID = JSON.parse(resCalled.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    voiceCallingUpdate("2" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
    voiceCalledUpdate("3" + calledSessionID, phoneNumberCalling, phoneNumberCalled);
    sleep(cfg[0].get.voiceCallRequestedTime);
}

export function updateVideoCallingSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/video_calling_update_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    videoCallingUpdate("4" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
    sleep(cfg[0].get.videoCallingRequestedTime);
}

export function terminateDataSession() {
    let res = http.get(`${cfg[0].get.webdis_url}LPOP/data_terminate_sessionIds`)
    let sessionID = JSON.parse(res.body)['LPOP'];
    let phoneNumber = userData[0].get.zz + sessionID.toString();

    dataTerminate("1" + sessionID, phoneNumber);
}

export function terminateVoiceCallingCalledSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/voice_calling_terminate_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let resCalled = http.get(`${cfg[0].get.webdis_url}LPOP/voice_called_terminate_sessionIds`)
    let calledSessionID = JSON.parse(resCalled.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    voiceCallingTerminate("2" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
    voiceCalledTerminate("3" + calledSessionID, phoneNumberCalling, phoneNumberCalled);
}

export function terminateVideoCallingSession() {
    let resCalling = http.get(`${cfg[0].get.webdis_url}LPOP/video_calling_terminate_sessionIds`)
    let callingSessionID = JSON.parse(resCalling.body)['LPOP'];
    let phoneNumberCalling = userData[0].get.zz + callingSessionID.toString();
    let phoneNumberCalled = callingCalled[0][parseInt(phoneNumberCalling)];

    videoCallingTerminate("4" + callingSessionID, phoneNumberCalling, phoneNumberCalled);
}