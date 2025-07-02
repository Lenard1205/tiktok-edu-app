import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Volume2, VolumeX, Type, FileX2, Play, Pause } from 'lucide-react';
import { usePlaylist, useAppSettings } from '../hooks/useData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { PlaylistItem } from '../types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [currentCourse, setCurrentCourse] = useState(settings.defaultCourse);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<number>>(new Set());
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  
  const { playlist, loading, error } = usePlaylist(currentCourse, settings);
  const {
    videoRef,
    isPlaying,
    isMuted,
    showSubtitles,
    isLoading,
    hasAudioPermission,
    requestAudioPermission,
    togglePlay,
    toggleMute,
    toggleSubtitles,
  } = useVideoPlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  // 课程标签
  const courseTags = ['1200', '2000', '3500', 'STEM', 'Relax'];

  // 获取当前播放项
  const currentItem = playlist[currentIndex];

  // 预加载下一个视频
  useEffect(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextItem = playlist[nextIndex];
      
      if (nextVideoRef.current && !preloadedVideos.has(nextIndex)) {
        nextVideoRef.current.src = nextItem.video.videoUrl;
        nextVideoRef.current.load();
        setPreloadedVideos(prev => new Set([...prev, nextIndex]));
      }
    }
  }, [currentIndex, playlist, preloadedVideos]);

  // 切换到下一个视频
  const nextVideo = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 重新开始播放列表
      setCurrentIndex(0);
    }
  };

  // 切换到上一个视频
  const prevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 播放状态切换（带视觉反馈）
  const handleTogglePlay = () => {
    console.log('用户点击切换播放状态，当前状态:', isPlaying ? '播放中' : '已暂停');
    togglePlay();
    // 显示播放/暂停图标反馈
    setShowPlayIcon(true);
    console.log('显示状态反馈图标:', !isPlaying ? '暂停图标' : '播放图标');
    setTimeout(() => {
      setShowPlayIcon(false);
      console.log('隐藏状态反馈图标');
    }, 2000); // 增加到2秒
  };

  // 手势处理 - 只处理滑动，移除点击处理
  useSwipeGestures(containerRef, {
    onSwipeUp: nextVideo,
    onSwipeDown: prevVideo,
    threshold: 50,
  });

  // 移除自动切换逻辑，保持视频循环播放
  // 只有用户交互时才切换视频，符合TikTok的播放逻辑


  // 首次播放权限请求
  const handleFirstPlay = () => {
    if (!hasAudioPermission) {
      requestAudioPermission();
    } else {
      handleTogglePlay();
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (error || !currentItem) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载失败，请刷新页面</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-black relative overflow-hidden select-none"
    >
      {/* 主视频 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={currentItem.video.videoUrl}
        poster=""
        muted={isMuted}
        playsInline
        autoPlay={hasAudioPermission}
        preload="auto"
        loop
      >
        {showSubtitles && (
          <track
            kind="subtitles"
            src={currentItem.video.subtitleUrl}
            srcLang="zh"
            label="中文"
            default
          />
        )}
      </video>

      {/* 预加载的下一个视频 */}
      <video
        ref={nextVideoRef}
        className="hidden"
        preload="auto"
        muted
      />

      {/* 毛玻璃背景遮罩 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* 顶部课程标签栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-12 pb-4 px-4">
        <div className="flex justify-center flex-wrap gap-2 sm:gap-4 md:gap-6">
          {courseTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setCurrentCourse(tag);
                setCurrentIndex(0);
                setPreloadedVideos(new Set());
              }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-medium transition-all shadow-lg ${
                currentCourse === tag
                  ? 'bg-white text-black scale-105'
                  : 'bg-white/25 text-white backdrop-blur-md hover:bg-white/35'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 右侧操作栏 */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col space-y-6">
        {/* 课程头像 */}
        <button
          onClick={() => navigate(`/course/${currentItem.course.tag}`)}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white"
        >
          <img
            src={currentItem.course.avatar}
            alt={currentItem.course.name}
            className="w-full h-full object-cover"
          />
        </button>

        {/* 点赞 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">
            {currentItem.video.likes > 1000 
              ? `${(currentItem.video.likes / 1000).toFixed(1)}k` 
              : currentItem.video.likes}
          </span>
        </div>

        {/* 评论 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">{currentItem.video.comments}</span>
        </div>

        {/* 收藏 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">{currentItem.video.favorites}</span>
        </div>

        {/* 字幕开关 */}
        <button
          onClick={toggleSubtitles}
          className="w-12 h-12 flex items-center justify-center"
        >
          {showSubtitles ? (
            <Type className="w-6 h-6 text-white" />
          ) : (
            <FileX2 className="w-6 h-6 text-white/60" />
          )}
        </button>
      </div>

      {/* 左下角课程信息 */}
      <div className="absolute left-4 bottom-24 z-20 max-w-[60%]">
        <h3 className="text-white text-lg font-semibold mb-2">
          {currentItem.course.name}
        </h3>
        <p className="text-white/80 text-sm">
          {currentItem.course.description}
        </p>
      </div>


      {/* 右下角声音状态 */}
      <div className="absolute bottom-20 right-4 z-20">
        <button
          onClick={toggleMute}
          className="w-8 h-8 flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* 首次播放引导 */}
      {!hasAudioPermission && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="text-white text-xl mb-4">欢迎来到教育视频平台</div>
            <div className="text-white/80 mb-8">点击开始播放视频</div>
            <button
              onClick={handleFirstPlay}
              className="bg-white text-black px-8 py-3 rounded-full font-medium"
            >
              开始播放
            </button>
          </div>
        </div>
      )}

      {/* 中间点击区域 - 专门处理播放暂停 */}
      {hasAudioPermission && (
        <div 
          className="absolute top-20 left-4 bottom-24 right-20 z-10 cursor-pointer"
          onClick={handleTogglePlay}
          style={{ 
            // 确保不影响其他元素，透明点击区域
            background: 'transparent'
          }}
        />
      )}

      {/* 播放状态视觉反馈 */}
      {showPlayIcon && hasAudioPermission && (
        <div className="absolute inset-0 flex items-center justify-center z-60 pointer-events-none">
          <div className="bg-black/90 rounded-full p-6 shadow-2xl border-4 border-white/30 animate-pulse">
            {!isPlaying ? (
              <Pause className="w-12 h-12 text-white fill-white drop-shadow-xl" />
            ) : (
              <Play className="w-12 h-12 text-white fill-white drop-shadow-xl" />
            )}
          </div>
        </div>
      )}

      {/* 加载状态 - 仅在初始加载和无播放权限时显示 */}
      {isLoading && !hasAudioPermission && (
        <div className="absolute inset-0 flex items-center justify-center z-25">
          <div className="bg-black/50 rounded-full p-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
