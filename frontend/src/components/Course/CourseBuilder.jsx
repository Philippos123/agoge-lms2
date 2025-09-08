import React, { useState } from "react";
import {
  Plus,
  Eye,
  GripVertical,
  Trash2,
  Save,
  BookOpen,
  Download,
  Upload,
  Palette,
  Settings,
} from "lucide-react";

import LessonEditor from "./LessonEditor";
import StyleEditor from "./StyleEditor";
import CoursePreview from "./CoursePreview";

import { toast } from "sonner";

const CourseBuilder = ({
  courseId,
  initialTitle = "",
  initialDescription = "",
  initialLessons = [],
}) => {
  const [courseTitle, setCourseTitle] = useState(initialTitle);
  const [courseDescription, setCourseDescription] = useState(initialDescription);
  const [lessons, setLessons] = useState(initialLessons);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [styleConfig, setStyleConfig] = useState({
    backgroundColor: "#ffffff",
    textColor: "#000000",
    primaryColor: "#8b5cf6",
    fontFamily: "Inter",
    fontSize: 16,
    spacing: 16,
    borderRadius: 8,
  });

  const getCourseData = () => ({
    title: courseTitle,
    description: courseDescription,
    lessons,
    styleConfig,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const saveCourseAsJson = () => {
    const courseData = getCourseData();
    const dataStr = JSON.stringify(courseData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileName = `${courseTitle || 'course'}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', exportFileName);
    link.click();

    toast.success("Course exported as JSON!");
  };

  const loadCourseFromJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setCourseTitle(data.title);
        setCourseDescription(data.description);
        setLessons(data.lessons);
        if (data.styleConfig) setStyleConfig(data.styleConfig);
        toast.success("Course loaded successfully!");
      } catch {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const addLesson = () => {
    const newLesson = {
      id: Date.now().toString(),
      title: "New Lesson",
      description: "",
      contentBlocks: [],
      duration: 5,
    };
    setLessons([...lessons, newLesson]);
    setSelectedLessonId(newLesson.id);
    setActiveTab("lessons");
  };

  const updateLesson = (id, updates) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLesson = (id) => {
    setLessons(lessons.filter(l => l.id !== id));
    if (selectedLessonId === id) setSelectedLessonId(null);
  };

  const selectedLesson = lessons.find(l => l.id === selectedLessonId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r bg-gray-100 p-4">
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Course Structure
          </h2>
          <button onClick={addLesson} className="w-full border px-4 py-2 rounded mb-2 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Lesson
          </button>
          <div className="flex gap-2 mb-2">
            <button onClick={saveCourseAsJson} className="flex-1 border px-2 py-1 rounded text-sm">
              <Download className="inline w-3 h-3 mr-1" /> Export
            </button>
            <button onClick={() => document.getElementById('course-upload').click()} className="flex-1 border px-2 py-1 rounded text-sm">
              <Upload className="inline w-3 h-3 mr-1" /> Import
            </button>
            <input id="course-upload" type="file" accept=".json" onChange={loadCourseFromJson} className="hidden" />
          </div>
        </div>
        <div>
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              onClick={() => {
                setSelectedLessonId(lesson.id);
                setActiveTab("lessons");
              }}
              className={`p-2 mb-2 border rounded cursor-pointer ${selectedLessonId === lesson.id ? "bg-purple-100" : "bg-white"}`}
            >
              <p className="text-sm font-semibold">{lesson.title}</p>
              <p className="text-xs text-gray-500">
                {lesson.contentBlocks.length} blocks • {lesson.duration} min
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLesson(lesson.id);
                }}
                className="text-red-500 text-xs mt-1"
              >
                <Trash2 className="inline h-3 w-3 mr-1" /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-2">{courseTitle || "Untitled Course"}</h1>
        <p className="text-gray-600 mb-6">
          {lessons.length} lessons • {lessons.reduce((acc, l) => acc + l.duration, 0)} min
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Course Title</label>
          <input
            className="w-full border px-4 py-2 rounded"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="Enter course title..."
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border px-4 py-2 rounded"
            rows={4}
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            placeholder="Describe your course..."
          />
        </div>

        {selectedLesson ? (
          <LessonEditor
            lessonTitle={selectedLesson.title}
            lessonDescription={selectedLesson.description}
            contentBlocks={selectedLesson.contentBlocks}
            onTitleChange={(title) => updateLesson(selectedLesson.id, { title })}
            onDescriptionChange={(description) => updateLesson(selectedLesson.id, { description })}
            onContentChange={(blocks) => updateLesson(selectedLesson.id, { contentBlocks: blocks })}
          />
        ) : (
          <div className="text-center mt-20">
            <BookOpen className="h-10 w-10 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">No lesson selected</p>
            <button onClick={addLesson} className="border px-4 py-2 rounded bg-purple-600 text-white">
              <Plus className="h-4 w-4 inline mr-1" /> Create First Lesson
            </button>
          </div>
        )}
      </div>

      {showPreview && (
        <CoursePreview
          courseData={getCourseData()}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default CourseBuilder;