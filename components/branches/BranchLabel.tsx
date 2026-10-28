'use client';
import { useBranchStore } from '@/stores/useBranchStore';
export default function BranchLabel({ detailed = false }: { detailed?: boolean }) {
  const branch = useBranchStore((state) => state.branch);
  const open = useBranchStore((state) => state.openSelector);
  if (!branch) return null;
  if (detailed)
    return (
      <section aria-label="Lokasi booking" className="mb-6 border border-black/15 bg-[#f8f8f6] p-5">
        <p className="text-[10px] tracking-wider text-black/45 uppercase">Lokasi bermain</p>
        <p className="mt-2 text-sm font-medium">{branch.name}</p>
        <p className="mt-1 text-xs leading-relaxed text-black/50">{branch.address}</p>
        <button type="button" onClick={() => open()} className="mt-3 text-xs text-[#ad422b] underline">
          Ganti cabang
        </button>
      </section>
    );
  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label={`Cabang: ${branch.name}. Ganti cabang`}
      className="max-w-44 border-black/15 text-left text-[10px] leading-4 focus-visible:outline-2 focus-visible:outline-[#ad422b] sm:max-w-52 sm:border-l sm:pl-3 sm:text-xs"
    >
      <span className="mr-1 inline text-black/45 sm:mr-0 sm:block">Cabang</span>
      <span className="inline font-medium text-[#ad422b] sm:block">
        {branch.name.replace('Black Padel ', '')}
      </span>
    </button>
  );
}
