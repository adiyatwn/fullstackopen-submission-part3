const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const app = express()

app.use(express.static('dist'))
app.use(cors())
app.use(express.json())

let persons = [
  {
    "id": "1",
    "name": "Arto Hellas",
    "number": "040-123456"
  },
  {
    "id": "2",
    "name": "Ada Lovelace",
    "number": "39-44-5323523"
  },
  {
    "id": "3",
    "name": "Dan Abramov",
    "number": "12-43-234345"
  },
  {
    "id": "4",
    "name": "Mary Poppendieck",
    "number": "39-23-6423122"
  }
]

morgan.token('data', function getData(request) {
  const body = request.body;
  return JSON.stringify(body)
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))

app.get('/api/persons', (request, response) => {
  return response.json(persons)
})

app.get('/api/persons/:id', (request, response) => {
  const id = request.params.id
  const person = persons.find(person => person.id === id)

  if (!person) {
    return response.status(404).end()
  } else {
    return response.json(person)
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = request.params.id
  persons = persons.filter(note => note.id !== id)

  return response.status(204).end()
})

const isNameExist = (name) => {
  return persons.some(person => person.name === name)
}

app.post('/api/persons', (request, response) => {
  const body = request.body
  const randomId = Math.round(Math.random() * 9999)

  if (!body.number || !body.name) {
    return response.status(400).json({
      error: "name or number is missing"
    })
  }
  if (isNameExist(body.name)) {
    return response.status(400).json({ error: 'name must be unique' })
  }

  const person = {
    id: String(randomId),
    name: body.name,
    number: body.number
  }

  persons = persons.concat(person)
  return response.json(person)
})

app.get('/info', (request, response) => {
  const totalPersons = persons.length
  const date = new Date()
  return response.send(`<p>Phonebook has info for ${totalPersons} people</p><p>${date}</p>`)
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
