import { SharedArray } from 'k6/data';

export const cfg = new SharedArray("constant data", function () {
    return [
        {
            get: {
                webdis_url: "http://127.0.0.1:7379/",
                numberOfAccounts: 5,
                MCC: "418",
                MNC: "020",
                TAC: "35684610", // it used to generate random IMEISVs
                diamClient: "localhost:3868",
                downloadedBytes: 2621424,
                uploadedBytes: 2621424,
                BitrateUL: 1073741000,
                BitrateDL: 1073741000,
                dataRequestedTime: 5,
                dataUsedtime: 30,
                voiceRequestedTime: 10,
                voiceCallUsedTime: 10,
                videoRequestedTime: 30,
                videoUsedTime: 5,
                dataUpdateSenderIterations: 10,
                voiceCallingCalledUpdateSenderIterations: 10,
                videoUpdateSenderIterations: 10,
            }
        }
    ]
});