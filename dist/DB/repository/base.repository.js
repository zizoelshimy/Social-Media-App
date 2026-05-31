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
    async insertMany({ data, }) {
        return (await this.model.insertMany(data));
    }
    async createOne({ data, options, }) {
        return (await this.create({ data, options }));
    }
    //what is HydratedDocument because we want to return a mongoose document that has all the methods of a mongoose document and what is raw doc because we want to return a plain js object that has all the properties of a mongoose document but without the methods of a mongoose document
    //implementation of findOne
    async findOne({ filter, projection, options, }) {
        const doc = this.model.findOne(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    async find({ filter, projection, options, }) {
        const doc = this.model.find(filter, projection);
        if (options?.lean)
            doc.lean(options.lean);
        if (options?.skip)
            doc.skip(options.skip);
        if (options?.limit)
            doc.limit(options.limit);
        return await doc.exec();
    }
    async paginate({ filter, projection, options = {}, page = 0, size = 5, }) {
        let count = -1;
        if (Number(page) > 0) {
            page = parseInt(page);
            size = parseInt(size);
            options.skip = (page - 1) * size;
            options.limit = size;
            count = await this.model.countDocuments({ filter });
        }
        const docs = await this.find({ filter: filter || {}, projection, options });
        return {
            docs,
            ...(Number(page) > 0
                ? { currentPage: page, size, pages: count / parseInt(size) }
                : {}),
        };
    }
    //implementation of findById
    async findById({ _id, projection, options, }) {
        const doc = this.model.findById(_id, projection);
        if (options?.lean)
            doc.lean(options.lean);
        return await doc.exec();
    }
    //update
    async updateOne({ filter, update, options, }) {
        return await this.model.updateOne(filter, update, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, }) {
        if (Array.isArray(update)) {
            update.push({ $set: { __v: { $add: ["__v", 1] } } });
            return await this.model.findOneAndUpdate(filter, update, { ...options, updatePipeline: true });
        }
        const updateWithVersion = {
            ...update,
            $inc: {
                ...update.$inc,
                __v: 1,
            },
        };
        return await this.model.findOneAndUpdate(filter, updateWithVersion, { ...options, $incr: { __v: 1 } }); // to increment the version key by 1 every time we update the document
    }
    async findByIdAndUpdate({ _id, update, options = { new: true }, }) {
        return await this.model.findByIdAndUpdate(_id, update, options);
    }
    async updateMany({ filter, update, options, }) {
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
