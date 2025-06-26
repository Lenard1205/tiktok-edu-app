import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useData } from '../hooks/useData';

const CoursePage: React.FC = () => {
  const { courseTag } = useParams<{ courseTag: string }>();
  const navigate = useNavigate();
  const { courses, videos, loading, error } = useData();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">加载失败，请刷新页面</div>
      </div>
    );
  }

  const course = courses.find(c => c.tag === courseTag);
  const courseVideos = videos.filter(v => v.courseName === courseTag);

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">课程不存在</div>
      </div>
    );
  }

  // 计算总统计数据
  const totalLikes = courseVideos.reduce((sum, video) => sum + video.likes, 0);
  const totalComments = courseVideos.reduce((sum, video) => sum + video.comments, 0);
  const totalFavorites = courseVideos.reduce((sum, video) => sum + video.favorites, 0);

  // 格式化数字显示
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* 固定头部 */}
      <div className="flex-shrink-0 relative">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
        
        {/* 导航栏 */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* 课程信息 */}
        <div className="relative z-10 flex flex-col items-center pb-8">
          {/* 课程头像 */}
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-3 border-white/30">
            <img
              src={course.avatar}
              alt={course.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 课程名称 */}
          <h1 className="text-2xl font-bold mb-2">{course.name}</h1>

          {/* 统计数据 */}
          <div className="flex items-center space-x-8 mb-6">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-lg font-semibold">{formatNumber(totalLikes)}</span>
              <span className="text-sm text-gray-400">点赞</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="text-lg font-semibold">{formatNumber(totalComments)}</span>
              <span className="text-sm text-gray-400">评论</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bookmark className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-semibold">{formatNumber(totalFavorites)}</span>
              <span className="text-sm text-gray-400">收藏</span>
            </div>
          </div>

          {/* 课程描述 */}
          <div className="max-w-xs text-center">
            <p className="text-gray-300 leading-relaxed">{course.description}</p>
          </div>
        </div>
      </div>

      {/* 可滚动的视频列表区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-20">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">课程视频 ({courseVideos.length})</h2>
          </div>

          {courseVideos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400">暂无视频内容</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {courseVideos.map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => navigate(`/video/${courseTag}/${index}`)}
                  className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden group"
                >
                  {/* 视频缩略图 */}
                  <video
                    className="w-full h-full object-cover"
                    src={video.videoUrl}
                    preload="metadata"
                    poster=""
                    muted
                  />

                  {/* 悬停效果 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-1" />
                    </div>
                  </div>

                  {/* 视频信息 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-xs text-white font-medium">
                      第{video.sequence}集
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-white/80 mt-1">
                      <span>{formatNumber(video.likes)}</span>
                      <span>{formatNumber(video.comments)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
