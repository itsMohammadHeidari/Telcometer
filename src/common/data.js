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