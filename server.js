const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
app.use(express.json());

const dataDir = path.join(__dirname, 'public', 'data');
const coursesFile = path.join(dataDir, 'courses.json');
const videosFile = path.join(dataDir, 'videos.json');

async function readJson(file) {
  const content = await fs.readFile(file, 'utf-8');
  return JSON.parse(content);
}

async function writeJson(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Courses API
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await readJson(coursesFile);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const courses = await readJson(coursesFile);
    const newCourse = { id: Date.now(), ...req.body };
    courses.push(newCourse);
    await writeJson(coursesFile, courses);
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save course' });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const courses = await readJson(coursesFile);
    const idx = courses.findIndex(c => c.id === Number(req.params.id));
    if (idx === -1) return res.status(404).end();
    courses[idx] = { ...courses[idx], ...req.body, id: courses[idx].id };
    await writeJson(coursesFile, courses);
    res.json(courses[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const courses = await readJson(coursesFile);
    const idx = courses.findIndex(c => c.id === Number(req.params.id));
    if (idx === -1) return res.status(404).end();
    const removed = courses.splice(idx, 1)[0];
    await writeJson(coursesFile, courses);
    res.json(removed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Videos API
app.get('/api/videos', async (req, res) => {
  try {
    const videos = await readJson(videosFile);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const videos = await readJson(videosFile);
    const newVideo = { id: Date.now(), ...req.body };
    videos.push(newVideo);
    await writeJson(videosFile, videos);
    res.json(newVideo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save video' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  try {
    const videos = await readJson(videosFile);
    const idx = videos.findIndex(v => v.id === Number(req.params.id));
    if (idx === -1) return res.status(404).end();
    videos[idx] = { ...videos[idx], ...req.body, id: videos[idx].id };
    await writeJson(videosFile, videos);
    res.json(videos[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const videos = await readJson(videosFile);
    const idx = videos.findIndex(v => v.id === Number(req.params.id));
    if (idx === -1) return res.status(404).end();
    const removed = videos.splice(idx, 1)[0];
    await writeJson(videosFile, videos);
    res.json(removed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

