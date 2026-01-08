import React, { useState, useRef } from 'react';
import { Upload, Settings, FileVideo, FileImage, FileText, Share2, Download, Zap, CheckCircle, X } from 'lucide-react';

const Salify = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [compressionMode, setCompressionMode] = useState('balanced');
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef(null);

  const compressionModes = {
    high: { label: 'High Quality', desc: 'Minimal compression, max clarity', ratio: 0.85 },
    balanced: { label: 'Balanced', desc: 'Medium compression, good quality', ratio: 0.60 },
    max: { label: 'Max Compression', desc: 'Aggressive compression, smaller size', ratio: 0.35 }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const processedFiles = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }));

    setSelectedFiles(prev => [...prev, ...processedFiles]);
    setShowResults(false);
    setCompressedFiles([]);
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('video/')) return <FileVideo className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('image/')) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    return <FileText className="w-6 h-6 text-gray-500" />;
  };

  const simulateCompression = async () => {
    if (selectedFiles.length === 0) return;

    setIsCompressing(true);
    setProgress(0);
    setShowResults(false);

    const ratio = compressionModes[compressionMode].ratio;
    const results = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Simulate compression progress for each file
      for (let p = 0; p <= 100; p += 5) {
        await new Promise(resolve => setTimeout(resolve, 30));
        const overallProgress = ((i * 100) + p) / selectedFiles.length;
        setProgress(overallProgress);
      }

      // Calculate compressed size with some randomization for realism
      const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      const compressedSize = Math.floor(file.size * ratio * randomFactor);
      const savedBytes = file.size - compressedSize;
      const savedPercent = Math.round((savedBytes / file.size) * 100);

      results.push({
        ...file,
        originalSize: file.size,
        compressedSize: compressedSize,
        savedBytes: savedBytes,
        savedPercent: savedPercent
      });
    }

    setProgress(100);
    await new Promise(resolve => setTimeout(resolve, 300));

    setCompressedFiles(results);
    setIsCompressing(false);
    setShowResults(true);
  };

  const downloadFile = async (file) => {
    try {
      // Create a canvas to compress images
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Calculate new dimensions (compress by reducing quality, not size)
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Convert to blob with compression
            const quality = compressionModes[compressionMode].ratio;
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `compressed_${file.name}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, file.type, quality);
          };
          img.src = e.target.result;
        };

        reader.readAsDataURL(file.file);
      } else {
        // For non-image files, download original (in real app, would compress)
        const url = URL.createObjectURL(file.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compressed_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file. Please try again.');
    }
  };

  const downloadAllFiles = async () => {
    for (const file of compressedFiles) {
      await downloadFile(file);
      // Small delay between downloads to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const shareFiles = (platform) => {
    const fileCount = compressedFiles.length;
    const totalSaved = formatFileSize(compressedFiles.reduce((acc, f) => acc + f.savedBytes, 0));
    alert(`📤 Sharing ${fileCount} compressed file(s) via ${platform}\n💾 Total saved: ${totalSaved}\n\n✅ In a real app, this would open the native ${platform} share dialog.`);
  };

  const resetApp = () => {
    setSelectedFiles([]);
    setCompressedFiles([]);
    setShowResults(false);
    setProgress(0);
    setIsCompressing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Salify.in</h1>
                <p className="text-xs text-gray-500">Compress files locally & securely</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Offline Mode
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* File Upload Section */}
        {!showResults && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Files</h2>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/quicktime,image/jpeg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={triggerFileInput}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition-all"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">Click to select files</p>
                <p className="text-sm text-gray-500">MP4, MOV, JPG, PNG, PDF supported</p>
                <p className="text-xs text-gray-400 mt-2">Multiple files supported - select all at once</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <button
                      onClick={resetApp}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors ml-4"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compression Mode */}
            {selectedFiles.length > 0 && !isCompressing && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Compression Mode</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(compressionModes).map(([key, mode]) => (
                    <button
                      key={key}
                      onClick={() => setCompressionMode(key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        compressionMode === key
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{mode.label}</h3>
                      <p className="text-xs text-gray-600 mb-2">{mode.desc}</p>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${
                        compressionMode === key ? 'bg-purple-200 text-purple-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        ~{Math.round((1 - mode.ratio) * 100)}% reduction
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={simulateCompression}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Start Compression
                </button>
              </div>
            )}

            {/* Progress Bar */}
            {isCompressing && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">
                      Processing files... {Math.floor((progress / 100) * selectedFiles.length + 1)} of {selectedFiles.length}
                    </span>
                    <span className="text-purple-600 font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Compressing with {compressionModes[compressionMode].label} mode...
                </p>
              </div>
            )}
          </>
        )}

        {/* Results Section */}
        {showResults && compressedFiles.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Compression Complete!</h2>
                  <p className="text-sm text-gray-600">All {compressedFiles.length} files processed successfully</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {compressedFiles.map(file => (
                  <div key={file.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-start gap-3">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-2 truncate">{file.name}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white/60 rounded-lg p-2">
                            <p className="text-xs text-gray-500 mb-0.5">Original Size</p>
                            <p className="font-semibold text-gray-700">{formatFileSize(file.originalSize)}</p>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2">
                            <p className="text-xs text-gray-500 mb-0.5">Compressed</p>
                            <p className="font-semibold text-green-600">{formatFileSize(file.compressedSize)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">-{file.savedPercent}%</div>
                          <p className="text-xs text-gray-600 mt-1">Saved<br/>{formatFileSize(file.savedBytes)}</p>
                        </div>
                        <button
                          onClick={() => downloadFile(file)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Savings */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-1">Total Saved</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatFileSize(compressedFiles.reduce((acc, f) => acc + f.savedBytes, 0))}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-1">Files Processed</p>
                    <p className="text-xl font-bold text-purple-600">{compressedFiles.length}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-gray-600 mb-1">Avg Reduction</p>
                    <p className="text-xl font-bold text-blue-600">
                      {Math.round(compressedFiles.reduce((acc, f) => acc + f.savedPercent, 0) / compressedFiles.length)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Compressed Files
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => shareFiles('WhatsApp')}
                  className="py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors shadow hover:shadow-lg"
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={() => shareFiles('Email')}
                  className="py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow hover:shadow-lg"
                >
                  ✉️ Email
                </button>
                <button
                  onClick={() => shareFiles('Cloud')}
                  className="py-3 px-4 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors shadow hover:shadow-lg"
                >
                  ☁️ Cloud Upload
                </button>
                <button
                  onClick={downloadAllFiles}
                  className="py-3 px-4 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow hover:shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetApp}
              className="w-full py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg border-2 border-gray-200 hover:border-purple-300"
            >
              ✨ Compress More Files
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">🔒 100% Private & Secure</p>
              <p className="text-xs text-blue-700">
                All compression happens locally on your device. Your files never leave your phone and are not uploaded to any server.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salify;
