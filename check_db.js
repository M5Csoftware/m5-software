const mongoose = require('mongoose');
const url = process.env.MONGODB_URI || "mongodb+srv://developerAltaf:XoowF2o7i5XN9b9w@cluster0.h1oemoz.mongodb.net/M5-logistic?retryWrites=true&w=majority";
mongoose.connect(url).then(async () => {
    console.log("Connected");
    const shipments = await mongoose.connection.collection('shipments').find({}).limit(5).toArray();
    console.log(shipments.map(s => ({ date: s.date, createdAt: s.createdAt, origin: s.origin, destination: s.destination })));
    process.exit();
}).catch(console.error);
