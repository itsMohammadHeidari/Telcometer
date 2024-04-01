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