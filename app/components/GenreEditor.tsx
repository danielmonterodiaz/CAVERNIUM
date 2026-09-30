"use client";

import { useState } from "react";

type GenreEditorProps = {
  genre: string | null;
};

export default function GenreEditor({
  genre,
}: GenreEditorProps) {
  const [selectedGenre, setSelectedGenre] =
    useState(genre ?? "");

  return (
    <>
      <select
        name="genre"
        value={selectedGenre}
        onChange={(e) => setSelectedGenre(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
      >
        <option value="" className="bg-white text-black">
          Select genre...
        </option>
        <option value="Pop" className="bg-white text-black">Pop</option>
        <option value="Rock" className="bg-white text-black">Rock</option>
        <option value="Alternative" className="bg-white text-black">Alternative</option>
        <option value="Indie" className="bg-white text-black">Indie</option>
        <option value="Electronic" className="bg-white text-black">Electronic</option>
        <option value="House" className="bg-white text-black">House</option>
        <option value="Techno" className="bg-white text-black">Techno</option>
        <option value="Trance" className="bg-white text-black">Trance</option>
        <option value="Ambient" className="bg-white text-black">Ambient</option>
        <option value="Hip-Hop / Rap" className="bg-white text-black">Hip-Hop / Rap</option>
        <option value="R&B / Soul" className="bg-white text-black">R&B / Soul</option>
        <option value="Funk" className="bg-white text-black">Funk</option>
        <option value="Jazz" className="bg-white text-black">Jazz</option>
        <option value="Blues" className="bg-white text-black">Blues</option>
        <option value="Classical" className="bg-white text-black">Classical</option>
        <option value="Folk" className="bg-white text-black">Folk</option>
        <option value="Acoustic" className="bg-white text-black">Acoustic</option>
        <option value="Country" className="bg-white text-black">Country</option>
        <option value="Metal" className="bg-white text-black">Metal</option>
        <option value="Punk" className="bg-white text-black">Punk</option>
        <option value="Reggae" className="bg-white text-black">Reggae</option>
        <option value="Ska" className="bg-white text-black">Ska</option>
        <option value="Latin" className="bg-white text-black">Latin</option>
        <option value="Salsa" className="bg-white text-black">Salsa</option>
        <option value="Cumbia" className="bg-white text-black">Cumbia</option>
        <option value="Reggaeton" className="bg-white text-black">Reggaeton</option>
        <option value="Bachata" className="bg-white text-black">Bachata</option>
        <option value="Merengue" className="bg-white text-black">Merengue</option>
        <option value="Tango" className="bg-white text-black">Tango</option>
        <option value="Flamenco" className="bg-white text-black">Flamenco</option>
        <option value="Brazilian" className="bg-white text-black">Brazilian</option>
        <option value="Afrobeat" className="bg-white text-black">Afrobeat</option>
        <option value="World Music" className="bg-white text-black">World Music</option>
        <option value="Gospel" className="bg-white text-black">Gospel</option>
        <option value="Singer-Songwriter" className="bg-white text-black">Singer-Songwriter</option>
        <option value="Lo-fi" className="bg-white text-black">Lo-fi</option>
        <option value="Experimental" className="bg-white text-black">Experimental</option>
        <option value="Soundtrack / Cinematic" className="bg-white text-black">Soundtrack / Cinematic</option>
        <option value="Spoken Word" className="bg-white text-black">Spoken Word</option>
        <option value="Other" className="bg-white text-black">Other</option>
      </select>

      {selectedGenre === "Other" && (
        <div className="mt-4">
          <label className="mb-2 block text-sm">
            Specify Genre
          </label>
          <input
            type="text"
            name="customGenre"
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#0286DC] focus:ring-1 focus:ring-[#0286DC]/40"
            placeholder="Enter the genre"
          />
        </div>
      )}
    </>
  );
}
