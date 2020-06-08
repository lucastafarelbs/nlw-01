import knex from 'knex'
import path from 'path'

const databaseFile ='database.sqlite'

const connection = knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, databaseFile)
  },
  useNullAsDefault: true
});

export default connection