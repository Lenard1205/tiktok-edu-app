import { useState, useRef, useEffect, useCallback } from 'react';

export const useVideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  // 请求音频播放权限
  const requestAudioPermission = useCallback(async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.play();
        setHasAudioPermission(true);
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('需要用户交互才能播放音频');
      // 即使播放失败，也认为已获得用户交互权限，允许界面继续
      setHasAudioPermission(true);
      setIsPlaying(false);
    }
  }, []);

  // 播放/暂停切换
  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pause();
        setIsPlaying(false);
        console.log('视频已暂停');
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
        setHasAudioPermission(true);
        console.log('视频开始播放');
      }
    } catch (error) {
      console.error('播放控制失败:', error);
      // 即使播放失败，也要切换状态以提供用户反馈
      setIsPlaying(!isPlaying);
      console.log(`状态切换为: ${!isPlaying ? '播放' : '暂停'} (模拟状态)`);
    }
  }, [isPlaying]);

  // 静音切换
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // 字幕切换
  const toggleSubtitles = useCallback(() => {
    setShowSubtitles(!showSubtitles);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = !showSubtitles ? 'showing' : 'hidden';
      }
    }
  }, [showSubtitles]);

  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // 视频事件处理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      }
    };
  }, []);

  return {
    videoRef,
    isPlaying,
    isMuted,
    showSubtitles,
    currentTime,
    duration,
    isLoading,
    hasAudioPermission,
    requestAudioPermission,
    togglePlay,
    toggleMute,
    toggleSubtitles,
    seekTo,
  };
};
