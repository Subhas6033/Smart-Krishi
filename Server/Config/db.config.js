import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI, {
      tls: true, // optional, keep if needed
    });

    console.log("Successfully connected to the DB");
  } catch (error) {
    console.log("Err While Connecting to the DB!!", error);
    process.exit(1);
  }
};

export { connectDB };
