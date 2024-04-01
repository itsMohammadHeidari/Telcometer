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