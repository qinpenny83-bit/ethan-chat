const express = require('express')
const { Readable } = require('stream')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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
  const text = (req.query.text || 'Hello').replace(/['"\\]/g, '')
  const tmpFile = path.join('/tmp', 'tts_' + Date.now() + '.mp3')
  try {
    const safe = text.replace(/'/g, "'\\''")
    execSync(`python3 -c "import asyncio,edge_tts;asyncio.run(edge_tts.Communicate('${safe}','en-US-AndrewNeural').save('${tmpFile}'))"`, { timeout: 30000 })
    if (fs.existsSync(tmpFile)) {
      const audio = fs.readFileSync(tmpFile)
      res.setHeader('Content-Type', 'audio/mpeg')
      res.send(audio)
      fs.unlink(tmpFile, () => {})
    } else {
      res.status(500).send('TTS failed')
    }
  } catch (e) {
    res.status(500).send('TTS error')
    try { fs.unlinkSync(tmpFile) } catch(_) {}
  }
})

const PORT = process.env.PORT || 4001
app.listen(PORT, '0.0.0.0', () => console.log('Running on port ' + PORT))
