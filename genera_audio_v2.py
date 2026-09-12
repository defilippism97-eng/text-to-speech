import asyncio
import edge_tts
import re
import os
from pydub import AudioSegment

VOICE = "it-IT-GiuseppeMultilingualNeural"
SRC_DIR = "testo_pulito"
TMP_DIR = "tmp_chunks"
OUT_DIR = "audio_output"

os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)


def split_into_chunks(text):
    """
    Divide il testo nei punti [[PAUSA:Xms]], restituendo una lista di
    tuple (testo_da_leggere, durata_pausa_in_ms_dopo_questo_pezzo).
    """
    parts = re.split(r"\[\[PAUSA:(\d+)m?s\]\]", text)
    # parts alterna: testo, numero_ms, testo, numero_ms, ...
    chunks = []
    i = 0
    while i < len(parts):
        chunk_text = parts[i].strip()
        pause_ms = 0
        if i + 1 < len(parts):
            pause_ms = int(parts[i + 1])
        if chunk_text:
            chunks.append((chunk_text, pause_ms))
        elif pause_ms:
            # pausa senza testo prima (unisce alla pausa precedente)
            if chunks:
                prev_text, prev_pause = chunks[-1]
                chunks[-1] = (prev_text, prev_pause + pause_ms)
        i += 2
    return chunks


async def synth_chunk(text, out_path):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(out_path)


async def process_file(input_path, output_path, file_id):
    with open(input_path, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = split_into_chunks(text)
    print(f"  {len(chunks)} blocchi da sintetizzare...")

    combined = AudioSegment.silent(duration=0)

    for idx, (chunk_text, pause_ms) in enumerate(chunks):
        tmp_path = os.path.join(TMP_DIR, f"{file_id}_{idx:04d}.mp3")
        await synth_chunk(chunk_text, tmp_path)
        segment = AudioSegment.from_mp3(tmp_path)
        combined += segment
        if pause_ms > 0:
            combined += AudioSegment.silent(duration=pause_ms)
        os.remove(tmp_path)
        if (idx + 1) % 10 == 0:
            print(f"    ...{idx + 1}/{len(chunks)} completati")

    combined.export(output_path, format="mp3")
    print(f"  -> Salvato: {output_path}")


async def main():
    files = sorted(f for f in os.listdir(SRC_DIR) if f.endswith(".txt"))
    for fname in files:
        print(f"Elaboro {fname}...")
        input_path = os.path.join(SRC_DIR, fname)
        output_path = os.path.join(OUT_DIR, fname.replace(".txt", ".mp3"))
        file_id = fname.replace(".txt", "")
        await process_file(input_path, output_path, file_id)

    print("\nTutti i file sono stati generati in 'audio_output'.")


if __name__ == "__main__":
    asyncio.run(main())
