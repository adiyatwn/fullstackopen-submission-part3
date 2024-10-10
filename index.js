require('dotenv').config()
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

app.use(express.static('dist'))
app.use(express.json())

// logging stuffs
morgan.token('data', function getData(request) {
  const body = request.body
  return JSON.stringify(body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :data'))

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      return response.json(result)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body
  const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`

  if (!body.number || !body.name) {
    return response.status(400).json({
      error: 'name or number is missing'
    })
  }

  Person.find({ name: body.name })
    .then(existedPerson => {
      if (existedPerson.length > 0) {
        const updatedObj = {
          name: body.name,
          number: body.number
        }

        const personId = existedPerson[0]._id
        const personUrl = `${fullUrl}${personId}`
        axios.put(personUrl, updatedObj)
          .then((putResponse) => {
            response.json(putResponse.data)
          })
          .catch(error => next(error))
      } else {
        const person = new Person({
          name: body.name,
          number: body.number,
        })
        person.save().then(savedPerson => {
          response.json(savedPerson)
        })
          .catch(error => next(error))
      }
    })
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      if (updatedPerson) {
        response.json(updatedPerson)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  Person.countDocuments({}).then(totalPersons => {
    const date = new Date()
    return response.send(`<p>Phonebook has info for ${totalPersons} people</p><p>${date}</p>`)
  })
})

const unknownEndpoint = (request, response) => {
  return response.status(404).json({ error: 'Unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({
      error: 'malformatted id'
    })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
