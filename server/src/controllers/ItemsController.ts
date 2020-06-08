import { Request, Response } from 'express'
import knex from '../database/connection'
import { transcode } from 'buffer'

class ItemsController {
  async findAll(req: Request, res: Response) {
    
    const items = await knex('items').select('*')

    const serializedItems = items.map( item => {
      return {
        id: item.id,
        title: item.title,
        image_url: `http://192.168.0.7:3333/uploads/${item.image}`
      }
    })
    
    return res.json(serializedItems)
  }
}

export default ItemsController