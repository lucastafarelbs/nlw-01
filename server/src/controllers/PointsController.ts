import { Request, Response } from 'express'
import knex from '../database/connection'

class PointsController {


  async findById(req: Request, res: Response) {
    const { id } = req.params
    const point = await knex('points').where('id', id).first()
    if (!point) return res.status(400).json({message: 'Point not found.'})
    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title', 'items.image')

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.0.7:3333/uploads/${point.image}`
    }
    return res.json({ point: serializedPoint, items })
  }

  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query

    const parsedItems = 
      String(items).split(',').map(item => Number(item.trim()))

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*')

    const serializedPoints = points.map(point => {
      return {
        ...point,
        image_url: `http://192.168.0.7:3333/uploads/${point.image}`
      }
    })

    return res.json(serializedPoints)
  }


  async create(req: Request, res: Response) {    
    const {
      image,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items
    } = req.body

    const point = {
      image: req.file.filename, 
      name, 
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf
    }

    const transaction = await knex.transaction()
    const insertedPoints = await transaction('points').insert(point)
    const point_id = insertedPoints[0]

    const pointItems = items
    .split(',')
    .map((item: string) => Number(item.trim()))
    .map((item_id: number) => ({ item_id, point_id }))

    await transaction('point_items').insert(pointItems)
    await transaction.commit()

    return res.json({ id: point_id, ...point })
  }

}

export default PointsController