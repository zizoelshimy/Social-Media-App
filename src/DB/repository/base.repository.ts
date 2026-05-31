import {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  ReturnsNewDoc,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from "mongoose";
import { IPaginate } from "../../common/interfaces";

export abstract class DataBaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>>;
  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc> | AnyKeys<TRawDoc>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc> | HydratedDocument<TRawDoc>[]> {
    return await this.model.create(data as any, options);
  }

  async insertMany({
    data,
  }: {
    data: AnyKeys<TRawDoc>[];
  }): Promise<HydratedDocument<TRawDoc>[]> {
    return (await this.model.insertMany(
      data as any,
    )) as HydratedDocument<TRawDoc>[];
  }

  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRawDoc>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    return (await this.create({ data, options })) as HydratedDocument<TRawDoc>;
  }
  //Finders
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>; //why flatten maps because we want to remove the _id and __v from the output &what is lean because we want to return a plain js object instead of a mongoose document
  //what is HydratedDocument because we want to return a mongoose document that has all the methods of a mongoose document and what is raw doc because we want to return a plain js object that has all the properties of a mongoose document but without the methods of a mongoose document
  //implementation of findOne
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findOne(filter, projection);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]> {
    const doc = this.model.find(filter, projection);
    if (options?.lean) doc.lean(options.lean);
    if (options?.skip) doc.skip(options.skip);
    if (options?.limit) doc.limit(options.limit);
    return await doc.exec();
  }

  async paginate({
    filter,
    projection,
    options = {},
    page = 0,
    size = 5,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | undefined;
    page?: number | string | undefined;
    size?: number | string | undefined;
  }): Promise<IPaginate<TRawDoc>> {
    let count: number = -1;
    if (Number(page) > 0) {
      page = parseInt(page as string);
      size = parseInt(size as string);
      options.skip = (page - 1) * size;
      options.limit = size;
      count = await this.model.countDocuments({ filter });
    }
    const docs = await this.find({ filter: filter || {}, projection, options });
    return {
      docs,
      ...(Number(page) > 0
        ? { currentPage: page, size, pages: count / parseInt(size as string) }
        : {}),
    };
  }

  //find by ID
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDoc> | null>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<TRawDoc>>; //why flatten maps because we want to remove the _id and __v from the output &what is lean because we want to return a plain js object instead of a mongoose document

  //implementation of findById
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: QueryOptions<TRawDoc> | null | undefined;
  }): Promise<any> {
    const doc = this.model.findById(_id, projection);
    if (options?.lean) doc.lean(options.lean);
    return await doc.exec();
  }

  //update
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: Parameters<Model<TRawDoc>["updateOne"]>[2] | null;
  }): Promise<UpdateResult> {
    return await this.model.updateOne(filter, update, options);
  }

  async findOneAndUpdate({
    filter,
    update,
    options = { new: true },
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options?: QueryOptions<TRawDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    if(Array.isArray(update)){
       update.push({$set:{__v:{$add:["__v",1]}}})
      return await this.model.findOneAndUpdate(filter, update, {...options,updatePipeline:true});
    }
    const updateWithVersion: UpdateQuery<TRawDoc> = {
      ...update,
      $inc: {
        ...(update as UpdateQuery<TRawDoc>).$inc,
        __v: 1,
      },
    };

    return await this.model.findOneAndUpdate(
      filter,
      updateWithVersion,
      {...options,$incr:{__v:1}},
    ); // to increment the version key by 1 every time we update the document
  }

  async findByIdAndUpdate({
    _id,
    update,
    options = { new: true },
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRawDoc>;
    options: QueryOptions<TRawDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndUpdate(_id, update, options);
  }

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline;
    options?: Parameters<Model<TRawDoc>["updateOne"]>[2] | null;
  }): Promise<UpdateResult> {
    return await this.model.updateMany(filter, update, options);
  }

  //delete
  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<TRawDoc>;
    update: UpdateQuery<TRawDoc>;
    options: QueryOptions<TRawDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndDelete(filter);
  }
  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRawDoc>;
    options: QueryOptions<TRawDoc> & ReturnsNewDoc;
  }): Promise<HydratedDocument<TRawDoc> | null> {
    return await this.model.findByIdAndDelete(_id);
  }
}
