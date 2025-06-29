import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, '../public/data');
const VIDEOS_FILE = path.join(DATA_DIR, 'videos.json');
const COURSES_FILE = path.join(DATA_DIR, 'courses.json');

const readVideos = async () => {
  const text = await fs.readFile(VIDEOS_FILE, 'utf-8');
  return JSON.parse(text);
};

const writeVideos = async (videos) => {
  await fs.writeFile(VIDEOS_FILE, JSON.stringify(videos, null, 2));
};

const readCourses = async () => {
  const text = await fs.readFile(COURSES_FILE, 'utf-8');
  return JSON.parse(text);
};

const writeCourses = async (courses) => {
  await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2));
};

app.get('/api/courses', async (req, res) => {
  try {
    res.json(await readCourses());
  } catch {
    res.status(500).json({ error: 'Failed to read courses' });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const courses = await readCourses();
    const index = courses.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Course not found' });
    courses[index] = { ...courses[index], ...req.body };
    await writeCourses(courses);
    res.json(courses[index]);
  } catch {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const courses = await readCourses();
    const newId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    const newCourse = { id: newId, ...req.body };
    courses.push(newCourse);
    await writeCourses(courses);
    res.json(newCourse);
  } catch {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    let courses = await readCourses();
    if (!courses.some(c => c.id === id)) {
      return res.status(404).json({ error: 'Course not found' });
    }
    courses = courses.filter(c => c.id !== id);
    await writeCourses(courses);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    res.json(await readVideos());
  } catch {
    res.status(500).json({ error: 'Failed to read videos' });
  }
});

app.put('/api/videos/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const videos = await readVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ error: 'Video not found' });
    videos[index] = { ...videos[index], ...req.body };
    await writeVideos(videos);
    res.json(videos[index]);
  } catch {
    res.status(500).json({ error: 'Failed to update video' });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const videos = await readVideos();
    const newId = videos.length ? Math.max(...videos.map(v => v.id)) + 1 : 1;
    const newVideo = { id: newId, ...req.body };
    videos.push(newVideo);
    await writeVideos(videos);
    res.json(newVideo);
  } catch {
    res.status(500).json({ error: 'Failed to create video' });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    let videos = await readVideos();
    if (!videos.some(v => v.id === id)) {
      return res.status(404).json({ error: 'Video not found' });
    }
    videos = videos.filter(v => v.id !== id);
    await writeVideos(videos);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
