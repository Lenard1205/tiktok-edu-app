import { useState, useEffect } from 'react';
import { Course, Video, PlaylistItem, AppSettings } from '../types';

export const useData = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesResponse, videosResponse] = await Promise.all([
          fetch('/api/courses').catch(() => fetch('/data/courses.json')),
          fetch('/api/videos').catch(() => fetch('/data/videos.json')),
        ]);

        if (!coursesResponse.ok || !videosResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const coursesData = await coursesResponse.json();
        const videosData = await videosResponse.json();

        setCourses(coursesData);
        setVideos(videosData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { courses, videos, loading, error };
};

export const usePlaylist = (courseTag: string, settings: AppSettings) => {
  const { courses, videos, loading, error } = useData();
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playedVideos, setPlayedVideos] = useState<Set<number>>(new Set());

  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generatePlaylist = () => {
    if (courses.length === 0 || videos.length === 0) return;

    const targetCourse = courses.find(c => c.tag === courseTag);
    if (!targetCourse) return;

    const courseVideos = videos.filter(v => v.courseName === courseTag);
    const introduceVideos = videos.filter(v => v.courseName === 'introduce');
    
    // 随机打乱课程视频
    const shuffledCourseVideos = shuffleArray(courseVideos);
    
    const newPlaylist: PlaylistItem[] = [];
    
    shuffledCourseVideos.forEach((video, index) => {
      // 添加课程视频
      newPlaylist.push({
        video,
        course: targetCourse,
      });

      // 每N个视频后插入介绍视频
      if (
        settings.enableIntroduce &&
        introduceVideos.length > 0 &&
        (index + 1) % settings.introduceFrequency === 0
      ) {
        const randomIntroVideo = introduceVideos[Math.floor(Math.random() * introduceVideos.length)];
        const introduceCourse = courses.find(c => c.tag === 'introduce');
        if (introduceCourse) {
          newPlaylist.push({
            video: randomIntroVideo,
            course: introduceCourse,
          });
        }
      }
    });

    setPlaylist(newPlaylist);
  };

  useEffect(() => {
    generatePlaylist();
  }, [courseTag, courses, videos, settings.enableIntroduce, settings.introduceFrequency]);

  const regeneratePlaylist = () => {
    setPlayedVideos(new Set());
    generatePlaylist();
  };

  return {
    playlist,
    loading,
    error,
    regeneratePlaylist,
    playedVideos,
    setPlayedVideos,
  };
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    introduceFrequency: 5,
    enableIntroduce: true,
    defaultCourse: '1200',
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
};
