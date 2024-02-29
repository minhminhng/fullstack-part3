require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

let persons = [
  { 
    "id": 1,
    "name": "Arto Hellas", 
    "number": "040-123456"
  },
  { 
    "id": 2,
    "name": "Ada Lovelace", 
    "number": "39-44-5323523"
  },
  { 
    "id": 3,
    "name": "Dan Abramov", 
    "number": "12-43-234345"
  },
  { 
    "id": 4,
    "name": "Mary Poppendieck", 
    "number": "39-23-6423122"
  }
]

app.use(express.static('build'))
app.use(cors())
app.use(express.json())

//---------- Request logger -------
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
// app.use(requestLogger)

//---------- Morgan --------
morgan.token('body', (request) => {
  if (request.method === 'POST') {
    return JSON.stringify(request.body)
  }
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
//----------- Routes --------
// Get all people
app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons =>
    response.json(persons)
  )
})

// Get people information
app.get('/info', (request, response) => {
  Person.countDocuments().then(result => {
    response.send(`<p>Phonebook has info for ${result} people</p>
      <p>${Date()}</p>`)
  })
})

// Get a person with id
app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)  
      }
      else {
        response.status(404).end()
      }  
    }).catch(error => next(error))
})

// Generate unique id from random number
const generateId = () => {
  const id = Math.floor(Math.random() * 1000)
  return id
}

// Add a person
app.post('/api/persons/', async (request, response, next) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({ error: 'missing name' })
  }

  if (!body.number) {
    return response.status(400).json({ error: 'missing number' })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  const exist = await Person.findOne({ name: new RegExp(body.name, 'i') })

  if (exist) {
    return response.status(400).json({ error: 'name must be unique' })
  }

  try {
    const savedPerson = await Person.create(person)
    if (savedPerson) {
      response.json(savedPerson)
    }
  }
  catch(error) {
    next(error)
  }  
})

// Delete a person with id
app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => 
      next(error)
    )  
})

// Update a person with id
app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  
  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})

//------- Unknown endpoint --------
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

//------- Error handler --------
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).json({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next (error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})