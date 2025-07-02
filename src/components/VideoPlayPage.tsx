import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Volume2, VolumeX, Type, FileX2, Play, Pause } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { useSwipeGestures } from '../hooks/useSwipeGestures';

const VideoPlayPage: React.FC = () => {
  const { courseTag, videoIndex } = useParams<{ courseTag: string; videoIndex: string }>();
  const navigate = useNavigate();
  const { courses, videos, loading, error } = useData();
  const [currentIndex, setCurrentIndex] = useState(parseInt(videoIndex || '0'));
  const [showPlayIcon, setShowPlayIcon] = useState(false);

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

  // 获取课程和视频数据
  const course = courses.find(c => c.tag === courseTag);
  const courseVideos = videos.filter(v => v.courseName === courseTag);
  const currentVideo = courseVideos[currentIndex];

  // 切换到下一个视频
  const nextVideo = () => {
    if (currentIndex < courseVideos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // 循环播放
    }
  };

  // 切换到上一个视频
  const prevVideo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(courseVideos.length - 1); // 循环播放
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

  if (error || !course || !currentVideo) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">视频不存在</div>
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
        src={currentVideo.videoUrl}
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
            src={currentVideo.subtitleUrl}
            srcLang="zh"
            label="中文"
            default
          />
        )}
      </video>

      {/* 毛玻璃背景遮罩 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* 顶部导航栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-12 pb-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            {currentIndex + 1} / {courseVideos.length}
          </div>
        </div>
      </div>

      {/* 右侧操作栏 */}
      <div className="absolute right-4 bottom-24 z-20 flex flex-col space-y-6">
        {/* 课程头像 */}
        <button
          onClick={() => navigate(`/course/${course.tag}`)}
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white"
        >
          <img
            src={course.avatar}
            alt={course.name}
            className="w-full h-full object-cover"
          />
        </button>

        {/* 点赞 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <Heart className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">
            {currentVideo.likes > 1000 
              ? `${(currentVideo.likes / 1000).toFixed(1)}k` 
              : currentVideo.likes}
          </span>
        </div>

        {/* 评论 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">{currentVideo.comments}</span>
        </div>

        {/* 收藏 */}
        <div className="flex flex-col items-center">
          <button className="w-12 h-12 flex items-center justify-center">
            <Bookmark className="w-7 h-7 text-white" />
          </button>
          <span className="text-white text-xs mt-1">{currentVideo.favorites}</span>
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

      {/* 左下角视频信息 */}
      <div className="absolute left-4 bottom-24 z-20 max-w-[60%]">
        <h3 className="text-white text-lg font-semibold mb-1">
          {course.name} - 第{currentVideo.sequence}集
        </h3>
        <p className="text-white/80 text-sm">
          {course.description}
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
            <div className="text-white text-xl mb-4">准备播放视频</div>
            <div className="text-white/80 mb-8">点击开始播放</div>
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

export default VideoPlayPage;
