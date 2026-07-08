const express = require('express')
const { Readable } = require('stream')

const app = express()
app.use(require('cors')())
app.use(express.json())
app.use(express.static(__dirname))

const KEY = 'sk-6d7c9a972d4f41189d45e7325ef38e96'
const COSYVOICE_URL = process.env.COSYVOICE_URL || process.env.COSYVOICE_TUNNEL || ''
const VOICE_NAME = process.env.VOICE_NAME || 'default'

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
  const text = req.query.text || 'Hello'
  // Try CosyVoice bridge first if configured
  if (COSYVOICE_URL) {
    try {
      const url = `${COSYVOICE_URL}/tts?text=${encodeURIComponent(text)}&voice=${VOICE_NAME}`
      const r = await fetch(url, { signal: AbortSignal.timeout(60000) })
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer())
        res.setHeader('Content-Type', 'audio/wav')
        return res.send(buf)
      }
    } catch (e) {
      console.log('CosyVoice failed, falling back:', e.message)
    }
  }
  // Fallback to Google TTS
  try {
    const r = await fetch(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`)
    if (!r.ok) throw Error('HTTP ' + r.status)
    const buf = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(buf)
  } catch (e) { res.status(500).send('TTS error') }
})

app.get('/api/voice-status', (req, res) => {
  res.json({ cosyvoice: !!COSYVOICE_URL, url: COSYVOICE_URL || null, voice: VOICE_NAME })
})

const PORT = process.env.PORT || 4001
app.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT))
