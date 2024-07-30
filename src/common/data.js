import { SharedArray } from 'k6/data';

export const cmd = new SharedArray("diameter commands", function () {
    return [
        {
            get: {
                CreditControl: 272
            }
        }
    ]
});

export const app = new SharedArray("diameter application ids", function () {
    return [
        {
            get: {
                ChargingControl: 4
            }
        }
    ]
});

export const vendor = new SharedArray("diameter application vendor ids", function () {
    return [
        {
            get: {
                TGPP: 10415
            }
        }
    ]
});

export const flag = new SharedArray("diameter application flags", function () {
    return [
        {
            get: {
                V: 0x80,
                M: 0x40
            }
        }
    ]
});

export const code = new SharedArray("diameter codes", function () {
    return [
        {
            get: {
                APNAggregateMaxBitrateDL: 1040,
                APNAggregateMaxBitrateUL: 1041,
                AccessNetworkInformation: 1263,
                AccountingRecordNumber: 485,
                AccountingRecordType: 480,
                AllocationRetentionPriority: 1034,
                AoCRequestType: 2055,
                AuthApplicationId: 258,
                CCInputOctets: 412,
                CCOutputOctets: 414,
                CCRequestNumber: 415,
                CCRequestType: 416,
                CCTime: 420,
                CalledPartyAddress: 832,
                CalledStationId: 30,
                CallingPartyAddress: 831,
                DestinationHost: 293,
                DestinationRealm: 283,
                Event: 825,
                EventTimestamp: 55,
                EventType: 823,
                Expires: 888,
                GGSNAddress: 847,
                IMSInformation: 876,
                IncomingTrunkGroupId: 852,
                MultipleServicesCreditControl: 456,
                MultipleServicesIndicator: 455,
                NodeFunctionality: 862,
                OriginHost: 264,
                OriginRealm: 296,
                OutgoingTrunkGroupId: 853,
                PDPAddress: 1227,
                PSInformation: 874,
                PreemptionCapability: 1047,
                PreemptionVulnerability: 1048,
                PriorityLevel: 1046,
                QoSClassIdentifier: 1028,
                QoSInformation: 1016,
                RatingGroup: 432,
                ReportingReason: 872,
                RequestedAction: 436,
                RequestedServiceUnit: 437,
                ResultCode: 268,
                RoleOfNode: 829,
                SGSNAddress: 1228,
                SIPMethod: 824,
                SIPRequestTimestamp: 834,
                ServiceContextId: 461,
                ServiceIdentifier: 439,
                ServiceInformation: 873,
                SessionId: 263,
                SubscriptionId: 443,
                SubscriptionIdData: 444,
                SubscriptionIdType: 450,
                TGPPChargingId: 2,
                TGPPMSTimeZone: 23,
                TGPPNSAPI: 10,
                TGPPPDPType: 3,
                TGPPRATType: 21,
                TGPPSGSNMCCMNC: 18,
                TGPPSelectionMode: 12,
                TGPPUserLocationInfo: 22,
                TerminationCause: 295,
                TimeStamps: 833,
                TrunkGroupId: 851,
                UsedServiceUnit: 446,
                UserEquipmentInfo: 458,
                UserEquipmentInfoType: 459,
                UserEquipmentInfoValue: 460,
                UserName: 1,
                UserSessionId: 830,
                VendorId: 266,
                VendorSpecificApplicationId: 260
            }
        }
    ]
});

export const userData = new SharedArray("user constant data", function () {
    return [
        {
            get: {
                prefix: "41820",
                preMiddleFix: "4182000000697",
                zz: "00",
                timeZone: "GMT + 3 hours 30 minutes No adjustment",
                userLocationInfo: "MCC 418 Iraq, MNC 20 Zain Iraq (previously Atheer), ECGI 0x10b",
                callRequestedTime: 30,
                callUsedTime: 5,
                videoRequestedTime: 30,
                videoUsedTime: 5,
            }
        }
    ]
});