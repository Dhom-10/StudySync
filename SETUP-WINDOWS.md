# Running StudySync on Windows

The main README explains setup on a Mac. These are the same steps for Windows 10 or 11.

> **Status: draft, not yet tested on a real Windows laptop.** If a step fails for you, write
> what happened in `TESTING.md` (or tell Abdulrahman) so we can fix this guide.

You need about 3 GB of free disk space and 16 GB of RAM is recommended.

## 1. Install the tools

Open **PowerShell** and run:

```powershell
winget install OpenJS.NodeJS        # Node.js (version 22.13 or newer; 24 recommended)
winget install Gyan.FFmpeg          # ffmpeg, converts the audio
winget install Ollama.Ollama        # Ollama, runs the summary model
winget install Git.Git              # Git, if you don't have it yet
```

Close PowerShell and open it again so the new commands are found. Check:

```powershell
node --version
ffmpeg -version
ollama --version
```

### whisper.cpp (speech to text)

There is no winget package, so download it by hand:

1. Go to https://github.com/ggml-org/whisper.cpp/releases (the latest release).
2. Under **Assets**, download `whisper-bin-x64.zip`.
   If you have an NVIDIA graphics card, the `whisper-cublas-...-bin-x64.zip` version is faster.
3. Unzip it to `C:\whisper`. You should see `C:\whisper\Release\whisper-cli.exe`
   (in some versions the `.exe` is directly in `C:\whisper`).
4. Test it:
   ```powershell
   C:\whisper\Release\whisper-cli.exe --help
   ```
   If Windows says a DLL is missing, install the
   [Microsoft Visual C++ Redistributable (x64)](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist).

## 2. Get the project and the models

```powershell
git clone https://github.com/allenjohn07/studysync.git
cd studysync

# Summary model (about 2 GB)
ollama pull llama3.2:3b

# Speech model (about 470 MB)
mkdir backend\models
curl.exe -L -o backend\models\ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

## 3. Settings file

```powershell
cd backend
copy .env.example .env
notepad .env
```

In Notepad, change **only** this line so it points to the file you unzipped:

```
WHISPER_BIN=C:\whisper\Release\whisper-cli.exe
```

Save and close.

## 4. Install the dependencies

```powershell
npm install
cd ..\frontend
npm install
cd ..
```

## 5. Run it

Ollama usually starts by itself on Windows (look for the llama icon near the clock).
If it is not running, open a terminal and run `ollama serve`.

Open **two** PowerShell windows in the `studysync` folder:

```powershell
# Window 1
cd backend
npm run dev
```

```powershell
# Window 2
cd frontend
npm run dev
```

Open http://localhost:3000, click **Log in**, then **Try the live demo**, and allow the microphone.

## Troubleshooting on Windows

| Problem | Fix |
| --- | --- |
| `'ffmpeg' is not recognized` | Close and reopen PowerShell after installing. If it still fails, set `FFMPEG_BIN` in `.env` to the full path of `ffmpeg.exe` |
| `Could not run whisper-cli` | Check the `WHISPER_BIN` path in `backend\.env` |
| `whisper-cli failed` with a missing DLL | Install the Visual C++ Redistributable (link above) |
| `npm` scripts are blocked ("running scripts is disabled") | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| Very slow transcript | Use the faster model: download `ggml-tiny.en.bin` and set `WHISPER_MODEL_PATH=./models/ggml-tiny.en.bin` |
| Windows Firewall pop-up for Node | Allow it on **private** networks |
