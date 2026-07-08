const express = require('express')
const { Readable } = require('stream')

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
    const text = encodeURIComponent(req.query.text || 'Hello')
    const r = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=en&client=tw-ob`)
    if (!r.ok) throw Error('HTTP ' + r.status)
    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(buf)
  } catch (e) { res.status(500).send('TTS error') }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT))
