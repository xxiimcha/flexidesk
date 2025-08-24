import { ImageOff } from "lucide-react";

export default function PhotosGrid({ item }) {
  const photos = Array.isArray(item?.photos) ? item.photos : [];
  if (!photos.length) {
    return (
      <div className="aspect-video bg-slate-50 ring-1 ring-slate-200 rounded grid place-items-center text-slate">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {photos.map((p, i) => (
        <div key={i} className="aspect-video bg-slate-100 rounded overflow-hidden relative">
          <img src={p.path || p.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
