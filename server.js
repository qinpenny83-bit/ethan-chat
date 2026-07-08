const express = require('express')
const { Readable } = require('stream')
const { EdgeTTS } = require('@travisvn/edge-tts')

const app = express()
app.use(require('cors')())
app.use(express.json())
app.use(express.static(__dirname))

const KEY = 'sk-6d7c9a972d4f41189d45e7325ef38e96'

app.post('/api/chat', async (req, res) => {
  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: 'deepseek-v4-flash', messages: req.body.messages, stream: true }),
    })
    res.setHeader('Content-Type', 'text/event-stream')
    Readable.fromWeb(r.body).pipe(res)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/tts', async (req, res) => {
  try {
    const tts = new EdgeTTS(req.query.text || 'Hello', 'en-US-AndrewNeural', { rate: '+0%', volume: '+0%', pitch: '+0Hz' })
    const audio = await tts.synthesize()
    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(Buffer.from(audio))
  } catch (e) { res.status(500).send('Error') }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT))
