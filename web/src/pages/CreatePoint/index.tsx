import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react'
import { Link, useHistory } from "react-router-dom";
import './styles.css'
import logo from '../../assets/logo.svg'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'

import api from '../../services/api'
import ibge from '../../services/ibge'
import { LeafletMouseEvent } from 'leaflet';
import Dropzone from '../../components/Dropzone/index'

interface Item {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string
}

interface IBGECityResponse {
  id: number,
  nome: string
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([])
  const [ufs, setUfs] = useState<string[]>([])
  const [cities, setCities] = useState<IBGECityResponse[]>([])
  const [selectedUf, setSelectedUf] = useState('0')
  const [selectedCity, setSelectedCity] = useState('0')
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0])
  const [formData, setFormData] = useState({
    name: '',
    email: '', 
    whatsapp: ''
  }) 
  
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedFile, setSelectedFile] = useState<File>()
  
  const history = useHistory()

  useEffect(() => {
    api.get('items')
      .then(response => {
        setItems(response.data)
      })
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords 
        setInitialPosition([latitude, longitude])
      },
      error => {
        setInitialPosition([-27.2092052, -49.6401092])
        console.log(error);
      }
    )
    // setSelectedPositi
    
  }, [])

  useEffect(() => {
    ibge.get<IBGEUFResponse[]>('localidades/estados')
      .then(response => {
        if (!response.data || !response.data.length)
          return setUfs([])


        const serializedResponse =
          response.data.map(item => item.sigla)
        setUfs(serializedResponse)
      })
  }, [])

  useEffect(() => {
    if (selectedUf === '0') return

    const url = `localidades/estados/${selectedUf}/municipios`
    ibge.get<IBGECityResponse[]>(url)
      .then(response => {
        if (!response.data || !response.data.length)
          return setCities([])

        const serializedResponse =
          response.data.map(item => ({ id: item.id, nome: item.nome }))
        setCities(serializedResponse)
      })
  }, [selectedUf])

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value
    setSelectedUf(uf)
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value
    setSelectedCity(city)
  }

  function handleMapClick(event: LeafletMouseEvent){
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng
    ])
  }

  function handleInputchange(event: ChangeEvent<HTMLInputElement>){
    const { name, value } = event.target
    setFormData({...formData, [name]: value})
  }

  function  handleSelectedItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)
    
    if (alreadySelected < 0) {
      setSelectedItems([ ...selectedItems, id ])
      return
    }

    delete selectedItems[alreadySelected]
    return setSelectedItems([...selectedItems])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const { name, email, whatsapp } = formData
    const uf = selectedUf
    const city = selectedCity
    const [ latitude, longitude ] = selectedPosition
    const items = selectedItems

    const data = new FormData()
    data.append('name', name)
    data.append('email', email)
    data.append('whatsapp', whatsapp)
    data.append('uf', uf) 
    data.append('city', city) 
    data.append('latitude', String(latitude)) 
    data.append('longitude', String(longitude)) 
    data.append('items', items.join(','))

    if (selectedFile)
      data.append('image', selectedFile)
    
    await api.post('points', data)

    alert('ponto de coleta criado!')
    history.push('/')
  }
  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta </h1>

        <Dropzone onFileUploaded={setSelectedFile}/>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputchange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputchange}
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputchange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15}
          onclick={handleMapClick}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            />
            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                name="uf"
                id="uf"
                onChange={handleSelectUF}>
                <option value="0">selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                onChange={handleSelectCity}>
                <option value="0">selecione uma cidade</option>
                {
                  cities.map(item => (
                    <option
                      key={item.id}
                      value={item.nome}>{item.nome}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {
              items.map(item => (
                <li key={item.id} 
                className={ selectedItems.includes(item.id) ? 'selected' : ''}
                onClick={() => handleSelectedItem(item.id)}>
                  <img src={item.image_url} alt={item.title} />
                  <span>
                    {item.title}
                  </span>
                </li>
              ))
            }
          </ul>

        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  )
}

export default CreatePoint