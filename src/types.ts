export interface Course {
  id: number;
  tag: string;
  name: string;
  description: string;
  avatar: string;
}

export interface Video {
  id: number;
  courseName: string;
  sequence: number;
  videoUrl: string;
  subtitleUrl: string;
  comments: number;
  likes: number;
  favorites: number;
}

export interface PlaylistItem {
  video: Video;
  course: Course;
}

export interface AppSettings {
  introduceFrequency: number; // 每N条视频插入一次介绍视频
  enableIntroduce: boolean;
  defaultCourse: string;
}
