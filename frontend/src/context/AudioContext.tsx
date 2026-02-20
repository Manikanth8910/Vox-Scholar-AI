import { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";

interface AudioContextType {
    audioSrc: string | null;
    setAudioSrc: (src: string | null) => void;
    playing: boolean;
    setPlaying: (v: boolean) => void;
    currentTime: number;
    duration: number;
    volume: number;
    setVolume: (v: number) => void;
    progress: number;
    podcastTitle: string;
    setPodcastTitle: (t: string) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    togglePlay: () => void;
    seek: (ratio: number) => void;
    skip: (secs: number) => void;
}

const AudioCtx = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
    const audioRef = useRef<HTMLAudioElement>(new Audio());
    const [audioSrc, setAudioSrcState] = useState<string | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [podcastTitle, setPodcastTitle] = useState("");

    const setAudioSrc = (src: string | null) => {
        setAudioSrcState(src);
        if (src) {
            audioRef.current.src = src;
            audioRef.current.load();
        }
    };

    const setVolume = (v: number) => {
        setVolumeState(v);
        audioRef.current.volume = v;
    };

    useEffect(() => {
        const audio = audioRef.current;
        audio.volume = volume;

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        const onDurationChange = () => setDuration(audio.duration);
        const onEnded = () => setPlaying(false);

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("durationchange", onDurationChange);
        audio.addEventListener("ended", onEnded);
        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("durationchange", onDurationChange);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio.src) return;
        if (playing) {
            audio.pause();
            setPlaying(false);
        } else {
            audio.play().catch(() => { });
            setPlaying(true);
        }
    };

    const seek = (ratio: number) => {
        if (!audioRef.current.duration) return;
        audioRef.current.currentTime = ratio * audioRef.current.duration;
    };

    const skip = (secs: number) => {
        const audio = audioRef.current;
        audio.currentTime = Math.max(0, Math.min(audio.currentTime + secs, audio.duration || 0));
    };

    return (
        <AudioCtx.Provider value={{
            audioSrc, setAudioSrc,
            playing, setPlaying,
            currentTime, duration,
            volume, setVolume,
            progress,
            podcastTitle, setPodcastTitle,
            audioRef: audioRef as React.RefObject<HTMLAudioElement>,
            togglePlay, seek, skip,
        }}>
            {children}
        </AudioCtx.Provider>
    );
}

export function useAudio() {
    const ctx = useContext(AudioCtx);
    if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
    return ctx;
}
