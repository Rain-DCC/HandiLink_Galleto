import React, { useEffect, useRef, useState } from 'react';
import { gatewayFetch } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  Mic,
  Square,
  Volume2,
  Send,
  Languages,
  Loader2,
  History,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface TranscriptRow {
  id: string;
  source_language: string;
  cebuano_transcript: string;
  english_translation: string;
  detected_intent: string;
  audio_duration_label: string;
  created_at: string;
}

const SAMPLE_CEBUANO_PHRASES = [
  'Nahuman na ang paghabol sa tulo ka roll nga Inabal nga Binituwon ug andam na para sa inspeksyon.',
  'Kulang na kami sa pula nga tina gikan sa kagon ug nanginahanglan ug napulo ka litro para sunod semana.',
  'Maayong adlaw, nadawat na namo ang order gikan sa Atelier Mindanao ug gisugdan na ang pagtahi.',
];

export const CebuanoSpeechPanel: React.FC = () => {
  const { pushToast } = useApp();
  const [history, setHistory] = useState<TranscriptRow[]>([]);
  const [cebuanoText, setCebuanoText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await gatewayFetch<{ transcripts: TranscriptRow[] }>('/speech/history');
      setHistory(res.transcripts || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load speech logs.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
    };
  }, []);

  const submitTranscript = async (payload: { audioDataUrl?: string; cebuanoText?: string; durationLabel: string }) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await gatewayFetch<{ transcript: TranscriptRow }>('/speech/transcribe', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setHistory(prev => [res.transcript, ...prev]);
      setCebuanoText('');
      pushToast('success', `Translated Cebuano message (${res.transcript.detected_intent}).`);
    } catch (err: any) {
      const msg = err?.message || 'Speech AI translation failed.';
      setErrorMsg(msg);
      pushToast('error', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone recording is not available in this browser context. You can type Cebuano below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = String(reader.result || '');
          submitTranscript({
            audioDataUrl: dataUrl,
            durationLabel: `${Math.max(1, recordingSeconds)}s Voice Note`,
          });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg('Microphone permission denied or unavailable. Enter Cebuano text below to translate.');
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cebuanoText.trim()) return;
    await submitTranscript({
      cebuanoText: cebuanoText.trim(),
      durationLabel: 'Text Dictation',
    });
  };

  const handleSpeakTts = async (item: TranscriptRow) => {
    setPlayingId(item.id);
    setErrorMsg('');
    try {
      const res = await gatewayFetch<{ audioBase64: string; mimeType: string }>('/speech/tts', {
        method: 'POST',
        body: JSON.stringify({ text: item.english_translation }),
      });
      const src = `data:${res.mimeType || 'audio/wav'};base64,${res.audioBase64}`;
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(src);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      await audio.play();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to synthesize speech audio.');
      setPlayingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9A227]/30 pb-5">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-[#8C6B0F] flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" />
            <span>Cebuano / Bisaya Speech AI Microservice</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3B2418] mt-1">
            Artisan Voice Companion & Bisaya Translator
          </h1>
          <p className="text-xs text-[#5A3825]/80 mt-1">
            Enables Binugao weavers to log loom progress, dye restock requests, and cultural notes in Cebuano / Bisaya.
          </p>
        </div>
        <Badge variant="brown" size="md">
          CebuanoSpeechAIService
        </Badge>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Controls */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#C9A227]/30 p-6 shadow-xs space-y-5">
          <h2 className="font-serif font-bold text-lg text-[#3B2418] border-b border-[#C9A227]/20 pb-3">
            Record or Dictate in Cebuano
          </h2>

          {/* Mic Capture */}
          <div className="bg-[#FAF6ED] p-5 rounded-xl border border-[#C9A227]/35 text-center space-y-3">
            <div className="flex justify-center">
              {isRecording ? (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse"
                  aria-label="Stop recording"
                >
                  <Square className="w-6 h-6" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleStartRecording}
                  className="w-16 h-16 rounded-full bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-60 flex items-center justify-center shadow-lg transition-colors"
                  aria-label="Start recording"
                >
                  <Mic className="w-7 h-7" />
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-[#3B2418]">
              {isRecording
                ? `Recording Cebuano Voice Note... ${recordingSeconds}s (Click to Stop & Transcribe)`
                : 'Tap Microphone to Record Artisan Voice Update'}
            </p>
          </div>

          {/* Text Dictation Fallback / Quick Entry */}
          <form onSubmit={handleTextSubmit} className="space-y-3 text-xs">
            <label className="block font-semibold text-[#3B2418]">
              Or Enter / Test Cebuano Message
            </label>
            <textarea
              rows={3}
              value={cebuanoText}
              onChange={e => setCebuanoText(e.target.value)}
              placeholder="Pananglitan: Nahuman na ang tulo ka habol nga Inabal..."
              className="w-full p-3 rounded-lg border border-[#C9A227]/40 bg-[#FAF6ED] text-[#24150F] focus:border-[#C9A227]"
            />

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[#8C6B0F] block">
                Sample Cebuano Loom & Material Phrases:
              </span>
              <div className="space-y-1">
                {SAMPLE_CEBUANO_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCebuanoText(phrase)}
                    className="w-full text-left p-2 rounded bg-[#FAF6ED] hover:bg-[#C9A227]/15 border border-[#C9A227]/20 text-[11px] text-[#5A3825] transition-colors"
                  >
                    “{phrase}”
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !cebuanoText.trim()}
              className="w-full py-2.5 bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-50 font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Translating & Detecting Intent...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Translate & Log Update</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Transcripts Feed */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#C9A227]/30 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#C9A227]/20 pb-3">
            <h2 className="font-serif font-bold text-lg text-[#3B2418] flex items-center gap-2">
              <History className="w-4 h-4 text-[#C9A227]" />
              <span>Translated Artisan Logs & Intent Feed</span>
            </h2>
            <span className="text-xs font-mono text-[#8C6B0F] tabular-nums">{history.length} records</span>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#5A3825]">
              <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
              <span>Loading translated speech archive...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5A3825]/70 space-y-2">
              <Sparkles className="w-8 h-8 text-[#C9A227] mx-auto" />
              <p>No Cebuano transcripts logged yet. Record a voice note or test a phrase to see translation and intent extraction.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {history.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#FAF6ED] border border-[#C9A227]/30 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="gold" size="sm">
                        {item.detected_intent}
                      </Badge>
                      <span className="text-[11px] text-[#5A3825]/70 font-mono">{item.audio_duration_label}</span>
                    </div>
                    <button
                      type="button"
                      disabled={playingId === item.id}
                      onClick={() => handleSpeakTts(item)}
                      className="px-2.5 py-1 rounded bg-[#3B2418] text-[#E5C76B] hover:bg-[#5A3825] disabled:opacity-50 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {playingId === item.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-[#C9A227]" />
                      )}
                      <span>{playingId === item.id ? 'Speaking...' : 'Play English Audio'}</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C6B0F] block">
                      Cebuano / Bisaya Original
                    </span>
                    <p className="text-[#3B2418] font-medium italic mt-0.5">“{item.cebuano_transcript}”</p>
                  </div>

                  <div className="pt-2 border-t border-[#C9A227]/20">
                    <span className="text-[10px] uppercase font-bold text-[#5A3825] block">
                      English Operational Translation
                    </span>
                    <p className="text-[#24150F] mt-0.5 leading-relaxed">{item.english_translation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
