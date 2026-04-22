const { Database } = require('arangojs');

let db;

const connectArango = async () => {
  try {
    db = new Database({
      url: process.env.ARANGODB_URI,
    });

    db.useBasicAuth(process.env.ARANGODB_USERNAME, process.env.ARANGODB_PASSWORD);

    // Create database if it doesn't exist
    const dbs = await db.listDatabases();
    if (!dbs.includes(process.env.ARANGODB_DATABASE)) {
      await db.createDatabase(process.env.ARANGODB_DATABASE);
      console.log(`ArangoDB: Created database ${process.env.ARANGODB_DATABASE}`);
    }
    db = db.database(process.env.ARANGODB_DATABASE);
    console.log(`ArangoDB Connected to database: ${process.env.ARANGODB_DATABASE}`);

    await setupCollections();
  } catch (error) {
    console.error(`Error connecting to ArangoDB: ${error.message}`);
    process.exit(1);
  }
};

const setupCollections = async () => {
  const documentCollections = ['symptoms', 'triggers'];
  const edgeCollections = ['triggered_by', 'co_occurs_with'];

  for (const name of documentCollections) {
    const collection = db.collection(name);
    const exists = await collection.exists();
    if (!exists) {
      await collection.create();
      console.log(`ArangoDB: Created document collection ${name}`);
    }
  }

  for (const name of edgeCollections) {
    const collection = db.collection(name);
    const exists = await collection.exists();
    if (!exists) {
      await collection.create({ type: 3 }); // type 3 is for Edge Collections
      console.log(`ArangoDB: Created edge collection ${name}`);
    }
  }
};

const getDb = () => db;

module.exports = { connectArango, getDb };
