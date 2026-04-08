"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async createOne({ data, options, }) {
        const [doc] = await this.create({ data: [data], options });
        return doc;
    }
    //implementation of findOne
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    //implementation of findById
    async findById({ _id, projection, options, }) {
        const doc = this.model.findById(_id, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    //update
    async updateOne({ filter, update, options }) {
        return await this.model.updateOne(filter, update, options);
    }
    async updateMany({ filter, update, options }) {
        return await this.model.updateMany(filter, update, options);
    }
    //delete
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
}
exports.DataBaseRepository = DataBaseRepository;
