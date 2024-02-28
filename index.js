const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

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
  response.json(persons)
})

// Get people information
app.get('/info', (request, response) => {
  response.send(`<p>Phonebook has info for ${persons.length} people</p>
      <p>${Date()}</p>`)
})

// Get a person with id
app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if (person) {
    response.json(person)  
  }
  else {
    response.status(404).end()
  }  
})

// Generate unique id from random number
const generateId = () => {
  const id = Math.floor(Math.random() * 1000)
  return id
}

// Add a person
app.post('/api/persons/', (request, response, next) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({ error: 'missing name' })
  }

  if (!body.number) {
    return response.status(400).json({ error: 'missing number' })
  }

  const person = {
    name: body.name,
    number: body.number,
    id: generateId()
  }

  const exist = persons.findIndex(p => p.name.toLocaleLowerCase() === body.name.toLocaleLowerCase())

  if (exist > -1) {
    return response.status(400).json({ error: 'name must be unique' })
  }

  persons = persons.concat(person)
  response.json(person)
})

// Delete a person with id
app.delete('/api/persons/:id', (request, response, next) => {
  const id = Number(request.params.id)
  persons = persons.filter(person => person.id !== id)

  response.status(204).end()
})

//------- Unknown endpoint --------
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})