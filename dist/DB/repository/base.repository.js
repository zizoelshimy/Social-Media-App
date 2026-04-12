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
    //what is HydratedDocument because we want to return a mongoose document that has all the methods of a mongoose document and what is raw doc because we want to return a plain js object that has all the properties of a mongoose document but without the methods of a mongoose document
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
    async findOneAndUpdate({ filter, update, options = { new: true } }) {
        return await this.model.findByIdAndUpdate(filter, update, options);
    }
    async findByIdAndUpdate({ _id, update, options = { new: true } }) {
        return await this.model.findByIdAndUpdate(_id, update, options);
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
    async findOneAndDelete({ filter, }) {
        return await this.model.findByIdAndDelete(filter);
    }
    async findByIdAndDelete({ _id, }) {
        return await this.model.findByIdAndDelete(_id);
    }
}
exports.DataBaseRepository = DataBaseRepository;
