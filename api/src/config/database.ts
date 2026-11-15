import mongoose from 'mongoose';
export async function connectDatabase(uri: string, dbName = 'dentiq_ai') { await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000, autoIndex: false }); }
export async function disconnectDatabase() { await mongoose.disconnect(); }
