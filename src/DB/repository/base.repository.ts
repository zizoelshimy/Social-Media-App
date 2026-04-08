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
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from "mongoose";
import { IUser } from "../../common/interfaces";

export abstract class DataBaseRepository<TRawDoc> {
  constructor(protected readonly model: Model<TRawDoc>) {}

  async create({
    data,
  }: {
    data: AnyKeys<TRawDoc>;
  }): Promise<HydratedDocument<TRawDoc>>;
  async create({
    data,
    options,
  }: {
    data: AnyKeys<IUser>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[]>;

  async create({
    data,
    options,
  }: {
    data: AnyKeys<IUser>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>[] | HydratedDocument<TRawDoc>> {
    return await this.model.create(data as any, options);
  }

  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<IUser>;
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TRawDoc>> {
    const [doc] = await this.create({ data: [data], options });
    return doc as HydratedDocument<TRawDoc>;
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
  }): Promise<HydratedDocument<IUser> | null>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDoc>;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<IUser>>; //why flatten maps because we want to remove the _id and __v from the output &what is lean because we want to return a plain js object instead of a mongoose document

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

  //find by ID
  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: false }) | null | undefined;
  }): Promise<HydratedDocument<IUser> | null>;

  async findById({
    _id,
    projection,
    options,
  }: {
    _id?: Types.ObjectId;
    projection?: ProjectionType<TRawDoc> | null | undefined;
    options?: (QueryOptions<TRawDoc> & { lean: true }) | null | undefined;
  }): Promise<null | FlattenMaps<IUser>>; //why flatten maps because we want to remove the _id and __v from the output &what is lean because we want to return a plain js object instead of a mongoose document

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
    options
}: {
    filter: QueryFilter<TRawDoc>,
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline,
    options?: Parameters<Model<TRawDoc>["updateOne"]>[2] | null
}):Promise<UpdateResult> {
    return await this.model.updateOne(filter , update , options)
}

async updateMany({
    filter,
    update,
    options
}: {
    filter: QueryFilter<TRawDoc>,
    update: UpdateQuery<TRawDoc> | UpdateWithAggregationPipeline,
    options?: Parameters<Model<TRawDoc>["updateOne"]>[2] | null
}):Promise<UpdateResult> {
    return await this.model.updateMany(filter , update , options)
}


//delete
async deleteOne({
    filter,
}: {
    filter: QueryFilter<TRawDoc>,
}):Promise<DeleteResult> {
    return await this.model.deleteOne(filter)
}

async deleteMany({
    filter,
}: {
    filter: QueryFilter<TRawDoc>,
}):Promise<DeleteResult> {
    return await this.model.deleteMany(filter)
}
}
