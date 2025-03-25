import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Loader2, Image as ImageIcon, HelpCircle, Moon, Sun } from 'lucide-react';

export default function VQAApp() {
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const fileInputRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !question) {
      setError("Both image and question are required.");
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('question', question);

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'An error occurred while making the prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl text-gray-800 dark:text-gray-100 relative">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <h1 className="text-3xl font-bold text-center mb-6 text-blue-700 dark:text-blue-300">🧠 Visual Question Answering</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-medium mb-2">Upload Image</label>
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-md text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full rounded-md object-contain max-h-64 mx-auto" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <ImageIcon className="w-8 h-8" />
                    <p>Drag & drop or click to upload image</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Enter Question</label>
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. What is in the image?"
                />
                <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {loading ? (<><Loader2 className="animate-spin w-4 h-4" /> Predicting...</>) : 'Get Answer'}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-4 py-2 rounded-md font-medium text-center">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 p-4 rounded-md shadow-sm">
              <h2 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">🎯 Prediction Result</h2>
              <p><strong>Question:</strong> {result.question}</p>
              <p><strong>Predicted Answer:</strong> {result.predicted_answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
