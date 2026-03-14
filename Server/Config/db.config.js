import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`);
    console.log(`Successfully connected to the DB `);
  } catch (error) {
    console.log("Err While Connecting to the DB!!", error);
    process.exit(1);
  }
};

export { connectDB };
