import asyncio
import edge_tts

VOICE = "it-IT-ElsaNeural"

TESTO_PROVA = (
    "Sono, prima di tutto, un cittadino. "
    "Sono un padre, un marito, un fratello, un figlio, "
    "un uomo immerso nelle contraddizioni e nelle meraviglie del tempo in cui vive. "
    "Non scrivo da una cattedra né da un ministero, "
    "non parlo dal pulpito di un titolo accademico né dall'altare di una carriera politica. "
    "Scrivo dal piano in cui tutti dovremmo aver diritto di parlare: come cittadino."
)

async def main():
    communicate = edge_tts.Communicate(TESTO_PROVA, VOICE)
    await communicate.save("prova_voce.mp3")
    print("Fatto: prova_voce.mp3")

if __name__ == "__main__":
    asyncio.run(main())
