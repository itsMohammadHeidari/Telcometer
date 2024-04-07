// import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
// sleep(1);

export const cfg = new SharedArray("constant data", function () {
    return [
        {
            get: {
                MCC: "418",
                MNC: "020",
                TAC: "35684610", // it used to generate random IMEISVs
                numberOfAccounts: 5,
                diamClient: "localhost:3868",
                downloadedBytes: 2621424,
                uploadedBytes: 2621424,
                BitrateUL: 1073741000,
                BitrateDL: 1073741000
            }
        }
    ]
});