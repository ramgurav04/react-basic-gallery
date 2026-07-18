import { useEffect, useState, useCallback, useRef, memo } from "react";

const PAGE_LIMIT = 30;

function Frame({ photo, orderNum }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const thumbUrl = `https://picsum.photos/id/${photo.id}/400/${Math.round(
    (400 * photo.height) / photo.width
  )}`;

  return (
    <a
      href={photo.url}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-amber-400/60 transition-colors duration-200"
    >
      <div
        className="relative w-full bg-neutral-900"
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        {!loaded && !failed && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-800 to-neutral-900" />
        )}
        {failed ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs">
            unavailable
          </div>
        ) : (
          <img
            src={thumbUrl}
            alt={`Photo by ${photo.author}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[11px] text-neutral-200 truncate pr-2">
          {photo.author}
        </span>
        <span className="text-[10px] font-mono text-amber-400 shrink-0">
          #{orderNum}
        </span>
      </div>
    </a>
  );
}

const Card = memo(Frame);

const App = () => {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cache = useRef(new Map());
  const abortRef = useRef(null);

  const getData = useCallback(async (pageIndex) => {
    if (cache.current.has(pageIndex)) {
      setPhotos(cache.current.get(pageIndex));
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `https://picsum.photos/v2/list?page=${pageIndex}&limit=${PAGE_LIMIT}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();

      cache.current.set(pageIndex, data);
      setPhotos(data);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError("Couldn't load this page. Check your connection and retry.");
      console.error("Error fetching data:", err);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    getData(index);
    return () => abortRef.current?.abort();
  }, [index, getData]);

  const handlePrev = useCallback(() => {
    setIndex((i) => Math.max(1, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePrev, handleNext]);

  let content;

  if (error) {
    content = (
      <div className="w-full text-center py-16">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => getData(index)}
          className="mt-4 bg-amber-400 text-black px-4 py-2 rounded text-sm font-semibold active:scale-95 transition-transform"
        >
          Retry
        </button>
      </div>
    );
  } else if (loading && photos.length === 0) {
    content = Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="animate-pulse bg-neutral-900 border border-neutral-800"
        style={{ aspectRatio: "4 / 3" }}
      />
    ));
  } else if (photos.length === 0) {
    content = (
      <p className="text-neutral-500 text-center w-full py-16 text-sm">
        No images found
      </p>
    );
  } else {
    content = photos.map((photo, i) => (
      <Card key={photo.id} photo={photo} orderNum={i + 1 + (index - 1) * PAGE_LIMIT} />
    ));
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-200">
          Picsum <span className="text-amber-400">gallery</span>
        </h1>
        <span className="text-[11px] font-mono text-neutral-500">
          roll {String(index).padStart(3, "0")}
        </span>
      </header>

      <div
        className="grid gap-1 p-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
      >
        {content}
      </div>

      <div className="flex justify-center gap-4 items-center py-6">
        <button
          disabled={index === 1 || loading}
          onClick={handlePrev}
          className={`bg-amber-400 text-sm text-black rounded px-4 py-2 font-semibold active:scale-95 transition-transform ${
            index === 1 || loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Prev
        </button>

        <span className="text-xs font-mono text-neutral-400 w-16 text-center">
          {loading ? "..." : `p. ${index}`}
        </span>

        <button
          disabled={loading}
          onClick={handleNext}
          className={`bg-amber-400 text-sm text-black rounded px-4 py-2 font-semibold active:scale-95 transition-transform ${
            loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default App;
