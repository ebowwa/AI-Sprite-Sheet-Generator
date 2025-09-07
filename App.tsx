import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { DownloadIcon, MagicIcon, PlayIcon, PauseIcon } from './components/icons';
import SpritePlayer from './components/SpritePlayer';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [columns, setColumns] = useState<number>(4);
  const [rows, setRows] = useState<number>(4);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(12);

  const numberOfFrames = columns * rows;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const fullPrompt = `Generate a high-quality sprite sheet for a video game. The subject is: "${prompt}".
The final sprite sheet must be a single image file containing a grid of animation frames.
- Total Frames: Exactly ${numberOfFrames} distinct frames showing a continuous animation sequence.
- Grid Layout: The frames must be arranged in a grid of ${columns} columns and ${rows} rows.
- Background: The background of the entire sprite sheet must be transparent.
- Style: The art style should be consistent across all frames.
- Spacing: All frames must be tightly packed in the grid with no space or gutter between them.
- Frame Size: Each frame must have the exact same dimensions.`;

      const calculatedRatio = columns / rows;
      
      type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
      let aspectRatio: AspectRatio;

      if (calculatedRatio > (16/9 + 4/3) / 2) {
        aspectRatio = '16:9';
      } else if (calculatedRatio > (4/3 + 1/1) / 2) {
        aspectRatio = '4:3';
      } else if (calculatedRatio > (1/1 + 3/4) / 2) {
        aspectRatio = '1:1';
      } else if (calculatedRatio > (3/4 + 9/16) / 2) {
        aspectRatio = '3:4';
      } else {
        aspectRatio = '9:16';
      }

      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: aspectRatio,
        },
      });

      const imageData: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;

      if (imageData) {
        setGeneratedImageUrl(`data:image/png;base64,${imageData}`);
        setIsPlaying(true);
      } else {
        setError("The AI did not return an image. Please try refining your prompt or try again.");
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`An error occurred while generating the sprite sheet. Please check your API key and prompt. Details: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-on-surface">AI Sprite Sheet Generator</h1>
          <p className="text-on-surface-secondary mt-2">Describe a character or object, and let AI generate the animation frames for you.</p>
        </header>

        <main className="flex flex-col gap-8">
          <div className="bg-surface rounded-lg p-6 shadow-lg">
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-lg font-semibold text-on-surface mb-2">
                  Sprite Description
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A pixel art knight walking to the right"
                  className="w-full h-28 bg-brand-bg border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
                  required
                  aria-label="Sprite Description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="columns" className="block text-sm font-medium text-on-surface-secondary mb-1">Columns</label>
                  <input
                    type="number"
                    id="columns"
                    value={columns}
                    onChange={e => setColumns(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full bg-brand-bg border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition"
                    min="1"
                    max="16"
                    aria-label="Number of columns"
                  />
                </div>
                 <div>
                  <label htmlFor="rows" className="block text-sm font-medium text-on-surface-secondary mb-1">Rows</label>
                  <input
                    type="number"
                    id="rows"
                    value={rows}
                    onChange={e => setRows(Math.max(1, parseInt(e.target.value, 10)))}
                    className="w-full bg-brand-bg border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition"
                    min="1"
                    max="16"
                    aria-label="Number of rows"
                  />
                </div>
              </div>
               <p className="text-sm text-on-surface-secondary text-center -mt-2">Total Frames: {numberOfFrames}</p>

              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg shadow-md transition-all duration-300 enabled:hover:bg-primary-hover enabled:hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <MagicIcon className="w-5 h-5" />
                    Generate Sprite Sheet
                  </>
                )}
              </button>
            </form>
          </div>

          <section className="bg-surface rounded-lg p-6 shadow-lg flex flex-col items-center justify-center gap-6 min-h-[350px]">
            {isLoading && (
              <div className="flex flex-col items-center gap-4 text-on-surface-secondary">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">Generating your sprite sheet...</p>
                <p className="text-sm">This can take a moment.</p>
              </div>
            )}
            {error && (
              <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            {!isLoading && !generatedImageUrl && !error && (
              <div className="text-center text-on-surface-secondary">
                <MagicIcon className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-on-surface">Ready to Create</h3>
                <p>Your generated sprite sheet preview will appear here.</p>
              </div>
            )}
            {generatedImageUrl && (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="flex-grow flex items-center justify-center w-full min-h-[256px]">
                  <SpritePlayer
                    imageUrl={generatedImageUrl}
                    columns={columns}
                    frames={numberOfFrames}
                    fps={fps}
                    isPlaying={isPlaying}
                  />
                </div>

                <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-4 bg-brand-bg/50 p-3 rounded-lg">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-surface rounded-full text-on-surface hover:bg-primary transition" aria-label={isPlaying ? 'Pause animation' : 'Play animation'}>
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                  </button>
                  <div className="flex-grow w-full sm:w-auto flex items-center gap-3">
                     <label htmlFor="fps-slider" className="text-sm font-medium text-on-surface-secondary whitespace-nowrap">
                       FPS: {fps}
                     </label>
                    <input
                      id="fps-slider"
                      type="range"
                      min="1"
                      max="60"
                      value={fps}
                      onChange={(e) => setFps(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-border-color rounded-lg appearance-none cursor-pointer accent-primary"
                      aria-label="Frames per second control"
                    />
                  </div>
                  <a
                    href={generatedImageUrl}
                    download="sprite-sheet.png"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md transition-all duration-300 hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    Download
                  </a>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;