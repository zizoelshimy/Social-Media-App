"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailability = void 0;
const enums_1 = require("../enums");
const getAvailability = (user) => {
    return [
        { availability: enums_1.AvailabilityEnum.PUBLIC },
        { availability: enums_1.AvailabilityEnum.ONLY_ME, createdBy: user._id }, // we can see our post if we set it to only me
        { availability: enums_1.AvailabilityEnum.FRiENDS, createdBy: { $in: [user._id, ...(user.friends || [])] } }, //we can see post of our friends if they set it to friends and we are their friend
        { tags: { $in: [user._id] } },
    ];
};
exports.getAvailability = getAvailability;
