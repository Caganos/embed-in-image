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
    if (!file) return alert("Please upload an image first");
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
      setFiles((p) => ({ ...p, embed: null }));
      setMsg("");
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExtract = async () => {
    const file = files.extract;
    if (!file) return alert("Please upload an image first");
    await drawImage(file);
    const ctx = canvasRef.current.getContext("2d");
    const imgData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const text = extractMessage(imgData);
    const isPrintable = /^[\x20-\x7E]+$/.test(text);
    setOutMsg(isPrintable ? text : "No secret code detected");
  };

  return (
    <div className="px-5 py-5 sm:px-10 min-h-screen justify-center bg-gradient-to-br from-red-900 to-black flex flex-col items-center text-white font-mono">
      <motion.h1
        className="text-5xl font-extrabold font-display mb-8 flex items-center space-x-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        <span>☭</span>
        <span>{mode === "embed" ? "Embed" : "Extract"}</span>
        <span>☭</span>
      </motion.h1>

      <div className="flex space-x-4 mb-6">
        {["embed", "extract"].map((m) => (
          <motion.button
            key={m}
            onClick={() => {
              setMode(m);
              setOutMsg("");
            }}
            className={`px-6 py-2 rounded-lg font-bold font-ui text-lg transition-colors ${
              mode === m
                ? "bg-red-700 border-2 border-red-600"
                : "bg-black/70 border border-red-800 text-red-500"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {m === "embed" ? "Embed" : "Extract"}
          </motion.button>
        ))}
      </div>

      <motion.div
        {...getRootProps()}
        className={`w-full max-w-2xl p-6 border-4 border-dashed rounded-lg mb-6 cursor-pointer ${
          isDragActive ? "border-red-600 bg-black/40" : "border-red-800"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <input {...getInputProps()} />
        {previews[mode] ? (
          <img
            src={previews[mode]}
            alt="preview"
            className="mx-auto mb-4 max-h-64 rounded border-2 border-red-600"
          />
        ) : (
          <p className="text-red-500">
            Drag & drop image here or click to select
          </p>
        )}
        {files[mode] && <p className="mt-2 text-red-400">{files[mode].name}</p>}
      </motion.div>

      {mode === "embed" && (
        <motion.div
          className="w-full max-w-2xl space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Enter Secret Code"
            className="w-full p-4 bg-black/70 font-mono rounded-lg border-2 border-red-800 focus:outline-none"
            rows={5}
          />
          <motion.button
            onClick={handleEmbed}
            disabled={!files.embed || !msg.trim()}
            className={`w-full py-3 rounded-lg font-bold transition-opacity ${
              !files.embed || !msg.trim()
                ? "bg-red-800 opacity-50 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-600"
            }`}
            whileHover={!files.embed || !msg.trim() ? {} : { scale: 1.02 }}
            whileTap={!files.embed || !msg.trim() ? {} : { scale: 0.98 }}
          >
            Embed & Download
          </motion.button>
        </motion.div>
      )}

      {mode === "extract" && (
        <motion.div
          className="w-full max-w-2xl space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            onClick={handleExtract}
            disabled={!files.extract}
            className={`w-full py-3 rounded-lg font-bold transition-opacity ${
              !files.extract
                ? "bg-red-800 opacity-50 cursor-not-allowed"
                : "bg-red-700 hover:bg-red-600"
            }`}
            whileHover={!files.extract ? {} : { scale: 1.02 }}
            whileTap={!files.extract ? {} : { scale: 0.98 }}
          >
            Extract Message
          </motion.button>
          {outMsg && (
            <motion.div
              className="p-4 bg-black/70 rounded-lg border border-red-600"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <p className="font-semibold">Secret Code:</p>
              <p className="mt-2 break-words">{outMsg}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
