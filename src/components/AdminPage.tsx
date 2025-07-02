import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Settings, Upload, LogOut, Shield } from 'lucide-react';
import { useData, useAppSettings } from '../hooks/useData';
import { Course, Video, AppSettings } from '../types';
import { AdminAuthService } from '../lib/adminAuth';
import SecurityDashboard from './SecurityDashboard';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { courses, videos, loading, error } = useData();
  const { settings, updateSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<'courses' | 'videos' | 'settings' | 'security'>('courses');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  // 课程表单状态
  const [courseForm, setCourseForm] = useState({
    tag: '',
    name: '',
    description: '',
    avatar: '',
  });

  // 视频表单状态
  const [videoForm, setVideoForm] = useState({
    courseName: '',
    sequence: 1,
    videoUrl: '',
    subtitleUrl: '',
    comments: 0,
    likes: 0,
    favorites: 0,
  });

  // 设置表单状态
  const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);

  const resetCourseForm = () => {
    setCourseForm({
      tag: '',
      name: '',
      description: '',
      avatar: '',
    });
    setEditingCourse(null);
  };

  const resetVideoForm = () => {
    setVideoForm({
      courseName: '',
      sequence: 1,
      videoUrl: '',
      subtitleUrl: '',
      comments: 0,
      likes: 0,
      favorites: 0,
    });
    setEditingVideo(null);
  };

  const handleSaveCourse = () => {
    // 这里应该调用API保存课程数据
    console.log('保存课程:', courseForm);
    setShowCourseForm(false);
    resetCourseForm();
  };

  const handleSaveVideo = () => {
    // 这里应该调用API保存视频数据
    console.log('保存视频:', videoForm);
    setShowVideoForm(false);
    resetVideoForm();
  };

  const handleSaveSettings = () => {
    updateSettings(settingsForm);
    alert('设置已保存');
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      tag: course.tag,
      name: course.name,
      description: course.description,
      avatar: course.avatar,
    });
    setShowCourseForm(true);
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoForm({
      courseName: video.courseName,
      sequence: video.sequence,
      videoUrl: video.videoUrl,
      subtitleUrl: video.subtitleUrl,
      comments: video.comments,
      likes: video.likes,
      favorites: video.favorites,
    });
    setShowVideoForm(true);
  };

  const handleDeleteCourse = (courseId: number) => {
    if (confirm('确定要删除这个课程吗？')) {
      console.log('删除课程:', courseId);
    }
  };

  const handleDeleteVideo = (videoId: number) => {
    if (confirm('确定要删除这个视频吗？')) {
      console.log('删除视频:', videoId);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      AdminAuthService.logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold">后台管理</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签栏 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'courses'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            课程管理
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'videos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            视频管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            系统设置
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>安全管理</span>
          </button>
        </div>

        {/* 课程管理 */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">课程列表</h2>
              <button
                onClick={() => setShowCourseForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>添加课程</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        课程信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        标签
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        描述
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={course.avatar}
                              alt={course.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {course.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {course.tag}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {course.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 视频管理 */}
        {activeTab === 'videos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">视频列表</h2>
              <button
                onClick={() => setShowVideoForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>添加视频</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        视频信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        课程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        统计
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videos.map((video) => (
                      <tr key={video.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            第{video.sequence}集
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {video.videoUrl}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {video.courseName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>点赞: {video.likes}</div>
                          <div>评论: {video.comments}</div>
                          <div>收藏: {video.favorites}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 系统设置 */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-lg font-semibold mb-6">系统设置</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    课程介绍插播频率
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settingsForm.introduceFrequency}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        introduceFrequency: parseInt(e.target.value),
                      })
                    }
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    每播放N个视频后插入一个课程介绍视频
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settingsForm.enableIntroduce}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          enableIntroduce: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      启用课程介绍视频插播
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    默认课程标签
                  </label>
                  <select
                    value={settingsForm.defaultCourse}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        defaultCourse: e.target.value,
                      })
                    }
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {courses.filter(c => c.tag !== 'introduce').map((course) => (
                      <option key={course.id} value={course.tag}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 安全管理 */}
        {activeTab === 'security' && (
          <div>
            <SecurityDashboard />
          </div>
        )}
      </div>

      {/* 课程表单弹窗 */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCourse ? '编辑课程' : '添加课程'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程标签
                </label>
                <input
                  type="text"
                  value={courseForm.tag}
                  onChange={(e) => setCourseForm({ ...courseForm, tag: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 1200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程名称
                </label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 1200词汇课程"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程描述
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="课程描述..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程头像URL
                </label>
                <input
                  type="url"
                  value={courseForm.avatar}
                  onChange={(e) => setCourseForm({ ...courseForm, avatar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCourseForm(false);
                  resetCourseForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 视频表单弹窗 */}
      {showVideoForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingVideo ? '编辑视频' : '添加视频'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属课程
                </label>
                <select
                  value={videoForm.courseName}
                  onChange={(e) => setVideoForm({ ...videoForm, courseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择课程...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.tag}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视频序号
                </label>
                <input
                  type="number"
                  min="1"
                  value={videoForm.sequence}
                  onChange={(e) => setVideoForm({ ...videoForm, sequence: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视频URL
                </label>
                <input
                  type="url"
                  value={videoForm.videoUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  字幕URL
                </label>
                <input
                  type="url"
                  value={videoForm.subtitleUrl}
                  onChange={(e) => setVideoForm({ ...videoForm, subtitleUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowVideoForm(false);
                  resetVideoForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                取消
              </button>
              <button
                onClick={handleSaveVideo}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
