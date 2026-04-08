import { connect } from "mongoose";
import { DB_URI } from "../config/config";
const connectDB = async () => {
    try{
        await connect(DB_URI,{serverSelectionTimeoutMS:30000})
        console.log("Database connected successfully")
    }catch(error){
        console.log("Database connection failed")
        console.error(error)
    }
}
export default connectDB;