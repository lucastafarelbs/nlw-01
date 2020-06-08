import express from 'express'
import path from 'path'
import routes from './routes'
import cors from 'cors'
import { errors } from 'celebrate'

try {
  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(routes)
  
  app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')))
  
  app.use(errors())

  app.listen(3333) 
} catch (error) {
  console.log('api error: ');  
  console.error(error);  
}