import React, { useRef, useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { embedMessage, extractMessage } from "./lib/utils";

export default function App() {
  const [mode, setMode] = useState("embed");
  const [msg, setMsg] = useState("");
  const [outMsg, setOutMsg] = useState("");

  const [files, setFiles] = useState({ embed: null, extract: null });

  const [previews, setPreviews] = useState({ embed: null, extract: null });

  const canvasRef = useRef();

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles((prev) => ({ ...prev, [mode]: acceptedFiles[0] }));
      setOutMsg("");
    },
    [mode]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  useEffect(() => {
    const file = files.embed;
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews((p) => ({ ...p, embed: url }));
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviews((p) => ({ ...p, embed: null }));
    }
  }, [files.embed]);

  useEffect(() => {
    const file = files.extract;
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews((p) => ({ ...p, extract: url }));
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviews((p) => ({ ...p, extract: null }));
    }
  }, [files.extract]);

  const drawImage = (file) =>
    new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current;
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        res();
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });

  const handleEmbed = async () => {
    const file = files.embed;
    if (!file) return alert("Upload an image first");

    await drawImage(file);
    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    try {
      const stego = embedMessage(imgData, msg);
      ctx.putImageData(stego, 0, 0);

      const base = file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement("a");
      link.download = `${base}_embed.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExtract = async () => {
    const file = files.extract;
    if (!file) return alert("Upload an image first");

    await drawImage(file);
    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const text = extractMessage(imgData);
    setOutMsg(text || "[no hidden text]");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-8 flex flex-col items-center">
      <motion.h1
        className="text-4xl font-extrabold text-white mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {mode === "embed" ? "🔐 Embed Secret Photo" : "🔍 Extract Secret Photo"}
      </motion.h1>

      <div className="flex space-x-4 mb-6">
        {["embed", "extract"].map((m) => (
          <motion.button
            key={m}
            onClick={() => {
              setMode(m);
              setOutMsg("");
            }}
            className={`px-4 py-2 rounded-full font-semibold transition-colors 
              ${
                mode === m
                  ? "bg-white text-purple-700"
                  : "bg-white/30 text-white/80"
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </motion.button>
        ))}
      </div>

      <motion.div
        {...getRootProps()}
        className={`w-full max-w-md p-4 border-4 border-dashed rounded-xl cursor-pointer text-center mb-6
          ${isDragActive ? "border-white bg-white/20" : "border-white/50"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <input {...getInputProps()} />
        {previews[mode] ? (
          <>
            <img
              src={previews[mode]}
              alt="preview"
              className="mx-auto mb-2 max-h-48 object-contain rounded"
            />
            <p className="text-white">
              <strong>{files[mode].name}</strong>
            </p>
          </>
        ) : (
          <p className="text-white/80">
            Drag & drop an image here, or click to select
          </p>
        )}
      </motion.div>

      {/* Embed UI */}
      {mode === "embed" && (
        <motion.div
          className="w-full max-w-md space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type your secret message..."
            className="w-full p-3 rounded-lg resize-none outline-none ring-2 ring-white/50"
            rows={4}
          />

          <motion.button
            onClick={handleEmbed}
            disabled={!files.embed || !msg.trim()}
            className={`w-full py-3 rounded-full bg-white text-purple-700 font-bold transition-opacity
              ${
                !files.embed || !msg.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
            whileHover={!files.embed || !msg.trim() ? {} : { scale: 1.02 }}
            whileTap={!files.embed || !msg.trim() ? {} : { scale: 0.98 }}
          >
            Embed &amp; Download
          </motion.button>
        </motion.div>
      )}

      {/* Extract UI */}
      {mode === "extract" && (
        <motion.div
          className="w-full max-w-md space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleExtract}
            disabled={!files.extract}
            className={`w-full py-3 rounded-full bg-white text-purple-700 font-bold transition-opacity
              ${
                !files.extract
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
            whileHover={!files.extract ? {} : { scale: 1.02 }}
            whileTap={!files.extract ? {} : { scale: 0.98 }}
          >
            Extract Message
          </motion.button>

          {outMsg && (
            <motion.div
              className="p-4 bg-white/80 rounded-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="font-semibold">Hidden Text:</p>
              <p className="mt-2 break-words">{outMsg}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
